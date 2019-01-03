/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {copyAndSpliceArray, getLastFromArray} from '../../../shared/utils/array.utils';
import {
  filterDirectAttributeChildren,
  findAttributeByName,
  generateAttributeName,
  splitAttributeName,
} from '../../../shared/utils/attribute.utils';
import {generateCorrelationId} from '../../../shared/utils/resource.utils';
import {CollectionModel} from '../collections/collection.model';
import {DocumentModel} from '../documents/document.model';
import {calculateDocumentHierarchyLevel} from '../documents/document.utils';
import {LinkInstanceModel} from '../link-instances/link-instance.model';
import {LinkTypeModel} from '../link-types/link-type.model';
import {AttributeModel} from './../collections/collection.model';
import {TableCursor} from './table-cursor';
import {
  TableColumn,
  TableColumnType,
  TableCompoundColumn,
  TableConfig,
  TableConfigColumn,
  TableConfigPart,
  TableConfigRow,
  TableHiddenColumn,
  TableModel,
  TablePart,
  TableSingleColumn,
} from './table.model';

export function findTableColumn(columns: TableColumn[], path: number[]): TableColumn {
  const index = getColumnIndex(path);

  if (path.length === 1) {
    return columns[index];
  }

  const column = columns[index] as TableCompoundColumn;
  return findTableColumn(column.children, path.slice(1));
}

export function findTableColumnByIndex(columns: TableColumn[], columnIndex: number): TableColumn {
  return filterLeafColumns(columns)[columnIndex];
}

export function getTableColumns(columns: TableColumn[], path: number[]): TableColumn[] {
  if (path.length === 0 || columns.length === 0) {
    return columns;
  }
  const [parentIndex, ...childPath] = path;
  const parent = columns[parentIndex] as TableCompoundColumn;
  return getTableColumns(parent.children, childPath);
}

export function addTableColumn(columns: TableColumn[], path: number[], column: TableColumn): TableColumn[] {
  // TODO implement by replaceColumn or get rid of it altogether
  const index = getColumnIndex(path);

  if (path.length === 1) {
    return copyAndSpliceArray(columns, index, 0, column);
  }

  const oldColumn = columns[index] as TableCompoundColumn;
  const newColumn = {...oldColumn, children: addTableColumn(oldColumn.children, path.slice(1), column)};
  return copyAndSpliceArray(columns, index, 1, newColumn);
}

export function replaceTableColumns(
  columns: TableColumn[],
  path: number[],
  deleteCount: number,
  addedColumns: TableColumn[] = []
): TableColumn[] {
  const index = getColumnIndex(path);

  if (path.length === 1) {
    if (addedColumns && addedColumns.length) {
      return copyAndSpliceArray(columns, index, deleteCount, ...addedColumns);
    } else {
      return copyAndSpliceArray(columns, index, 1);
    }
  }

  const oldColumn = columns[index] as TableCompoundColumn;
  const newColumn = {
    ...oldColumn,
    children: replaceTableColumns(oldColumn.children, path.slice(1), deleteCount, addedColumns),
  };
  return copyAndSpliceArray(columns, index, 1, newColumn);
}

export function moveTableColumn(columns: TableColumn[], fromPath: number[], toPath: number[]): TableColumn[] {
  const column = findTableColumn(columns, fromPath);
  const columnsWithout = replaceTableColumns(columns, fromPath, 1, null);
  return addTableColumn(columnsWithout, toPath, column);
}

function getColumnIndex(path: number[]): number {
  if (!path || !path.length) {
    throw Error('Invalid table column path');
  }

  return path[0];
}

export function createTableColumnsBySiblingAttributeIds(
  allAttributes: AttributeModel[],
  attributeIds: string[]
): TableColumn[] {
  if (!attributeIds || attributeIds.length === 0) {
    return [];
  }

  const attributes = allAttributes.filter(attribute => attributeIds.includes(attribute.id));
  const attributeNames = attributes.map(attribute => attribute.name);

  const childAttributes = allAttributes.filter(attribute =>
    attributeNames.some(name => attribute.name.startsWith(name + '.'))
  );
  attributes.push(...childAttributes);

  const {parentName} = splitAttributeName(attributeNames[0]);
  if (!parentName) {
    return createTableColumnsFromAttributes(attributes);
  }

  const parent = findAttributeByName(allAttributes, parentName);
  return createTableColumnsFromAttributes(attributes, parent);
}

export function createTableColumnsFromAttributes(
  allAttributes: AttributeModel[],
  parentAttribute?: AttributeModel,
  columnsConfig: TableConfigColumn[] = []
): TableColumn[] {
  const attributes = filterDirectAttributeChildren(allAttributes, parentAttribute);
  attributes.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

  if (columnsConfig && columnsConfig.length) {
    return createColumnsFromConfig(columnsConfig, allAttributes, attributes);
  }

  return attributes.map(attribute => {
    const parent = new TableSingleColumn(attribute.id);
    const children = createTableColumnsFromAttributes(allAttributes, attribute);
    return new TableCompoundColumn(parent, children);
  });
}

function createColumnsFromConfig(
  columnsConfig: TableConfigColumn[],
  allAttributes: AttributeModel[],
  attributes: AttributeModel[]
): TableColumn[] {
  const attributeIds = attributes.map(attribute => attribute.id);

  const columns = columnsConfig.reduce<TableColumn[]>((preparedColumns, column) => {
    if (column.type === TableColumnType.COMPOUND) {
      const attributeId = column.attributeIds[0];
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (!attribute) {
        return preparedColumns;
      }

      const parent = new TableSingleColumn(attributeId, null, column.width);
      // TODO should children not in config really appear instead of just parent?
      const children = createTableColumnsFromAttributes(allAttributes, attribute, column.children);
      return preparedColumns.concat(new TableCompoundColumn(parent, children));
    }

    if (column.type === TableColumnType.HIDDEN) {
      const ids = column.attributeIds.filter(id => attributeIds.includes(id));
      return ids.length ? preparedColumns.concat(new TableHiddenColumn(ids)) : preparedColumns;
    }

    return preparedColumns;
  }, []);

  const usedAttributeIds = columnsConfig.reduce((ids, columnConfig) => {
    return columnConfig.attributeIds ? ids.concat(columnConfig.attributeIds) : ids;
  }, []);
  const remainingAttributeIds = attributeIds.filter(id => !usedAttributeIds.includes(id));
  return remainingAttributeIds.length ? columns.concat(new TableHiddenColumn(remainingAttributeIds)) : columns;
}

export function getAttributeIdFromColumn(column: TableColumn) {
  switch (column.type) {
    case TableColumnType.COMPOUND:
      return (column as TableCompoundColumn).parent.attributeId;
    default:
      throw Error(`Cannot get attributeId from column: ${column}`);
  }
}

export function maxColumnDepth(columns: TableColumn[]): number {
  return Math.max(
    ...columns.map(column => {
      if (column.type === TableColumnType.COMPOUND) {
        const children = (column as TableCompoundColumn).children;
        return children.length ? maxColumnDepth(children) + 1 : 1;
      }
      return 1;
    })
  );
}

export function splitColumnPath(path: number[]): {parentPath: number[]; columnIndex: number} {
  if (!path || !path.length) {
    throw Error('Invalid table column path');
  }

  return {
    parentPath: path.slice(0, path.length - 1),
    columnIndex: path[path.length - 1],
  };
}

export function splitRowPath(rowPath: number[]): {parentPath: number[]; rowIndex: number} {
  if (!rowPath || !rowPath.length) {
    throw Error('Invalid table column path');
  }

  return {
    parentPath: rowPath.slice(0, -1),
    rowIndex: rowPath[rowPath.length - 1],
  };
}

export function mergeHiddenColumns(column1: TableHiddenColumn, column2: TableHiddenColumn): TableHiddenColumn {
  const attributeIds = column1.attributeIds.concat(column2.attributeIds);
  return new TableHiddenColumn(attributeIds);
}

export function extendHiddenColumn(column: TableHiddenColumn, attributeId: string): TableHiddenColumn {
  return new TableHiddenColumn(column.attributeIds.concat(attributeId));
}

export function containCompoundColumn(columns: TableColumn[]): boolean {
  return columns && columns.some(column => column.type === TableColumnType.COMPOUND);
}

export function createCollectionPart(
  collection: CollectionModel,
  index: number,
  last?: boolean,
  config?: TableConfig
): TablePart {
  const configPart = getConfigPart(config, index);
  const columnsConfig = configPart && configPart.collectionId === collection.id ? configPart.columns : null;

  const columns = createTableColumnsFromAttributes(collection.attributes, null, columnsConfig);
  const columnDepth = maxColumnDepth(columns);

  if (last) {
    columns.push(createEmptyColumn(collection.attributes));
  }

  return {
    index,
    collectionId: collection.id,
    columns,
    columnDepth,
  };
}

export function createEmptyColumn(attributes: AttributeModel[]): TableCompoundColumn {
  const attributeName = generateAttributeName(attributes);
  return new TableCompoundColumn(new TableSingleColumn(null, attributeName), []);
}

export function createLinkPart(linkType: LinkTypeModel, index: number, config?: TableConfig): TablePart {
  const configPart = getConfigPart(config, index);
  const columnsConfig = configPart && configPart.linkTypeId === linkType.id ? configPart.columns : null;

  const columns = createTableColumnsFromAttributes(linkType.attributes, null, columnsConfig);
  const columnDepth = maxColumnDepth(columns);

  return {
    index,
    linkTypeId: linkType.id,
    columns,
    columnDepth,
  };
}

function getConfigPart(config: TableConfig, index: number): TableConfigPart {
  return config && config.parts && config.parts.length > index ? config.parts[index] : null;
}

export function maxTableColumnDepth(parts: TablePart[]): number {
  return Math.max(...parts.map(part => part.columnDepth));
}

export function calculateColumnRowspan(table: TableModel, partIndex: number, columnPath: number[]): number {
  const level = columnPath.length;
  const part = table.parts[partIndex];

  const tableColumnDepth = maxTableColumnDepth(table.parts);
  const depthDifference = tableColumnDepth - part.columnDepth;
  return part.columnDepth - level + depthDifference;
}

export function resizeLastColumnChild(column: TableCompoundColumn, delta: number): TableCompoundColumn {
  const width = column.parent.width + (column.children.length ? 0 : delta);
  const parent = new TableSingleColumn(column.parent.attributeId, null, width);

  const children = column.children.map((child, index) => {
    // TODO what if the last child is hidden column?
    if (index === column.children.length - 1 && child.type === TableColumnType.COMPOUND) {
      return resizeLastColumnChild(child as TableCompoundColumn, delta);
    }
    return child;
  });

  return new TableCompoundColumn(parent, children);
}

export const HIDDEN_COLUMN_WIDTH = 10;

export function getTableColumnWidth(column: TableColumn, showHiddenColumns: boolean): number {
  switch (column.type) {
    case TableColumnType.COMPOUND:
      return getCompoundColumnWidth(column as TableCompoundColumn, showHiddenColumns);
    case TableColumnType.HIDDEN:
      return showHiddenColumns ? HIDDEN_COLUMN_WIDTH : 0;
    case TableColumnType.SINGLE:
      return (column as TableSingleColumn).width;
  }
}

function getCompoundColumnWidth(column: TableCompoundColumn, showHiddenColumns: boolean): number {
  if (column.children.length === 0) {
    return column.parent.width;
  }

  return column.children.reduce((sum, child) => sum + getTableColumnWidth(child, showHiddenColumns), 0);
}

export function hasTableColumnChildren(column: TableCompoundColumn): boolean {
  return column.children.length > 0;
}

export function isLastTableColumnChild(columns: TableColumn[], path: number[]): boolean {
  if (path.length < 2) {
    return false;
  }

  const {parentPath, columnIndex} = splitColumnPath(path);
  const parent = findTableColumn(columns, parentPath) as TableCompoundColumn;
  return columnIndex === parent.children.length - 1;
}

export function hasLastTableColumnChildHidden(column: TableCompoundColumn): boolean {
  if (!hasTableColumnChildren(column)) {
    return false;
  }

  const lastColumn = getLastFromArray(column.children);
  if (lastColumn.type === TableColumnType.COMPOUND) {
    return hasLastTableColumnChildHidden(lastColumn as TableCompoundColumn);
  }

  return lastColumn.type === TableColumnType.HIDDEN;
}

export function filterLeafColumns(columns: TableColumn[]): TableColumn[] {
  return columns.reduce<TableColumn[]>((leafColumns, column) => {
    if (column.type === TableColumnType.HIDDEN) {
      return leafColumns.concat(column);
    }
    if (column.type === TableColumnType.COMPOUND) {
      const compoundColumn = column as TableCompoundColumn;
      if (compoundColumn.children.length) {
        return filterLeafColumns(compoundColumn.children);
      }
      return leafColumns.concat(compoundColumn.parent);
    }
    return leafColumns;
  }, []);
}

export function calculateColumnsWidth(columns: TableColumn[], showHiddenColumns: boolean): number {
  return columns.reduce((width, column) => width + getTableColumnWidth(column, showHiddenColumns), 0);
}

export function findTableRow(rows: TableConfigRow[], rowPath: number[]): TableConfigRow {
  if (!rowPath || rowPath.length === 0) {
    return null;
  }

  const [index, ...childPath] = rowPath;
  const row = rows[index];

  if (childPath.length === 0) {
    return row;
  }

  return row && findTableRow(row.linkedRows, childPath);
}

export function countLinkedRows(row: TableConfigRow): number {
  if (!row || !row.linkedRows || row.linkedRows.length === 0 || !row.expanded) {
    return 1;
  }

  return row.linkedRows.reduce((count, linkedRow) => count + countLinkedRows(linkedRow), 0);
}

export function isTableRowStriped(rowPath: number[]): boolean {
  const {parentPath, rowIndex} = splitRowPath(rowPath);
  if (parentPath.length === 0) {
    return rowIndex % 2 === 1;
  }

  return isTableRowStriped(parentPath) ? rowIndex % 2 === 0 : rowIndex % 2 === 1;
}

export function isLastTableColumn(cursor: TableCursor, part: TablePart): boolean {
  return (
    (cursor.columnPath && cursor.columnPath.length === 1 && cursor.columnPath[0] === part.columns.length - 1) ||
    (cursor.columnIndex && cursor.columnIndex === part.columns.length - 1)
  );
}

export function getTablePart(table: TableModel, cursor: TableCursor): TablePart {
  return table.parts[cursor.partIndex];
}

export function getTableElement(tableId: string): HTMLElement {
  return document.getElementById(`table-${tableId}`);
}

export function createEmptyTableRow(parentDocumentId?: string): TableConfigRow {
  return {
    correlationId: generateCorrelationId(),
    linkedRows: [],
    parentDocumentId,
  };
}

export function createTableRow(document: DocumentModel, linkInstance?: LinkInstanceModel): TableConfigRow {
  return {
    documentId: document.id,
    linkInstanceId: linkInstance && linkInstance.id,
    linkedRows: [],
  };
}

export function isTableRowExpanded(rows: TableConfigRow[], rowPath: number[]): boolean {
  if (rowPath.length === 0) {
    return true;
  }

  const [index, ...childPath] = rowPath;
  const row = rows[index];

  if (childPath.length === 0) {
    return row.linkedRows.length === 0 || row.expanded;
  }

  return !!row && row.expanded && isTableRowExpanded(row.linkedRows, childPath);
}

export function calculateRowHierarchyLevel(
  row: TableConfigRow,
  documentIds: Set<string>,
  documentsMap: {[id: string]: DocumentModel}
): number {
  if (!row.documentId && !row.parentDocumentId) {
    return 0;
  }

  const document = documentsMap[row.documentId];
  const parentDocumentId = document && document.metaData ? document.metaData['parentId'] : row.parentDocumentId;
  return calculateDocumentHierarchyLevel(parentDocumentId, documentIds, documentsMap);
}

export function isValidHierarchicalRowOrder(
  rows: TableConfigRow[],
  documentsMap: {[id: string]: DocumentModel}
): boolean {
  const documentIds = new Set(rows.filter(row => row.documentId).map(row => row.documentId));
  let documentIdsStack: string[] = [];

  for (const row of rows) {
    const parentDocumentId = getRowParentDocumentId(row, documentIds, documentsMap);
    if (documentIds.has(parentDocumentId) && !documentIdsStack.includes(parentDocumentId)) {
      return false;
    }
    documentIdsStack = updateDocumentIdsStack(row.documentId, parentDocumentId, documentIdsStack, documentIds);
  }

  return true;
}

function updateDocumentIdsStack(
  documentId: string,
  parentDocumentId: string,
  documentIdsStack: string[],
  documentIdsFilter: Set<string>
): string[] {
  if (!parentDocumentId || !documentIdsFilter.has(parentDocumentId)) {
    return documentId ? [documentId] : [];
  }

  if (!documentId) {
    return documentIdsStack;
  }

  return documentIdsStack.slice(0, documentIdsStack.indexOf(parentDocumentId) + 1).concat(documentId);
}

export function sortTableRowsByHierarchy(
  rows: TableConfigRow[],
  documentsMap: {[id: string]: DocumentModel}
): TableConfigRow[] {
  const documentIds = new Set(rows.filter(row => row.documentId).map(row => row.documentId));

  const rowsMap = createRowsMapByParentDocumentId(rows, documentIds, documentsMap);
  return createRowsFromRowsMap(null, rowsMap);
}

function createRowsMapByParentDocumentId(
  rows: TableConfigRow[],
  documentIdsFilter: Set<string>,
  documentsMap: {[id: string]: DocumentModel}
): {[parentDocumentId: string]: TableConfigRow[]} {
  return rows.reduce((map, row) => {
    const parentDocumentId = getRowParentDocumentId(row, documentIdsFilter, documentsMap) || null;
    const siblingRows = map[parentDocumentId] || [];
    map[parentDocumentId] = siblingRows.concat(row);
    return map;
  }, {});
}

function createRowsFromRowsMap(
  documentId: string,
  rowsMap: {[parentDocumentId: string]: TableConfigRow[]}
): TableConfigRow[] {
  const rows = rowsMap[documentId] || [];
  return rows.reduce((orderedRows, row) => {
    return orderedRows.concat(row).concat(row.documentId ? createRowsFromRowsMap(row.documentId, rowsMap) : []);
  }, []);
}

export function getRowParentDocumentId(
  row: TableConfigRow,
  documentIdsFilter: Set<string>,
  documentsMap: {[id: string]: DocumentModel}
): string {
  const document = documentsMap[row && row.documentId];
  const parentDocumentId =
    (document && document.metaData && document.metaData['parentId']) || (row && row.parentDocumentId);
  return documentIdsFilter.has(parentDocumentId) ? parentDocumentId : null;
}

export function isTableConfigChanged(
  viewConfig: TableConfig,
  perspectiveConfig: TableConfig,
  documentsMap: {[id: string]: DocumentModel}
): boolean {
  if (JSON.stringify(viewConfig.parts) !== JSON.stringify(perspectiveConfig.parts)) {
    return false;
  }

  const viewRows =
    viewConfig.rows &&
    viewConfig.rows.filter((row, index, rows) => {
      // filter out rows with deleted documents and last empty row
      return !(row.documentId && !documentsMap[row.documentId]) && !(!row.documentId && index === rows.length - 1);
    });

  const perspectiveRows = perspectiveConfig.rows && perspectiveConfig.rows.slice(0, viewRows.length);

  return JSON.stringify(viewRows) !== JSON.stringify(perspectiveRows);
}
