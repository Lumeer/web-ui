/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {Attribute, Collection} from '../collections/collection';
import {DocumentModel} from '../documents/document.model';
import {calculateDocumentHierarchyLevel} from '../documents/document.utils';
import {LinkInstance} from '../link-instances/link.instance';
import {LinkType} from '../link-types/link.type';
import {TableCursor} from './table-cursor';
import {
  DEFAULT_COLUMN_WIDTH,
  TableColumnType,
  TableConfig,
  TableConfigColumn,
  TableConfigPart,
  TableConfigRow,
  TableModel,
} from './table.model';
import {objectsByIdMap} from '../../../shared/utils/common.utils';
import {AllowedPermissions} from '../../model/allowed-permissions';

export function findTableColumn(columns: TableConfigColumn[], path: number[]): TableConfigColumn {
  if (!path || path.length === 0) {
    return null;
  }

  const index = getColumnIndex(path);
  const column = columns[index];

  if (path.length === 1) {
    return column;
  }

  return findTableColumn(column.children, path.slice(1));
}

export function findTableColumnByIndex(columns: TableConfigColumn[], columnIndex: number): TableConfigColumn {
  return filterLeafColumns(columns)[columnIndex];
}

export function getTableColumns(columns: TableConfigColumn[], path: number[]): TableConfigColumn[] {
  if (path.length === 0 || columns.length === 0) {
    return columns;
  }
  const [parentIndex, ...childPath] = path;
  const parent = columns[parentIndex];
  return getTableColumns(parent.children, childPath);
}

export function addTableColumn(
  columns: TableConfigColumn[],
  path: number[],
  column: TableConfigColumn
): TableConfigColumn[] {
  // TODO implement by replaceColumn or get rid of it altogether
  const index = getColumnIndex(path);

  if (path.length === 1) {
    return copyAndSpliceArray(columns, index, 0, column);
  }

  const oldColumn = columns[index];
  const newColumn: TableConfigColumn = {
    ...oldColumn,
    children: addTableColumn(oldColumn.children, path.slice(1), column),
    width: oldColumn.width || DEFAULT_COLUMN_WIDTH,
  };
  return copyAndSpliceArray(columns, index, 1, newColumn);
}

export function replaceTableColumns(
  columns: TableConfigColumn[],
  path: number[],
  deleteCount: number,
  addedColumns: TableConfigColumn[] = []
): TableConfigColumn[] {
  const index = getColumnIndex(path);

  if (path.length === 1) {
    if (addedColumns && addedColumns.length) {
      return copyAndSpliceArray(columns, index, deleteCount, ...addedColumns);
    } else {
      return copyAndSpliceArray(columns, index, 1);
    }
  }

  const oldColumn = columns[index];
  const newColumn: TableConfigColumn = {
    ...oldColumn,
    children: replaceTableColumns(oldColumn.children, path.slice(1), deleteCount, addedColumns),
    width: oldColumn.width || DEFAULT_COLUMN_WIDTH,
  };
  return copyAndSpliceArray(columns, index, 1, newColumn);
}

export function moveTableColumn(
  columns: TableConfigColumn[],
  fromPath: number[],
  toPath: number[]
): TableConfigColumn[] {
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
  allAttributes: Attribute[],
  attributeIds: string[]
): TableConfigColumn[] {
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
  allAttributes: Attribute[],
  parentAttribute?: Attribute,
  columnsConfig: TableConfigColumn[] = []
): TableConfigColumn[] {
  const attributes = filterDirectAttributeChildren(allAttributes, parentAttribute);
  attributes.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

  if (columnsConfig?.length) {
    return createColumnsFromConfig(columnsConfig, allAttributes, attributes);
  }

  return attributes.map(attribute => ({
    type: TableColumnType.COMPOUND,
    attributeIds: [attribute.id],
    children: createTableColumnsFromAttributes(allAttributes, attribute),
    width: DEFAULT_COLUMN_WIDTH,
  }));
}

function createColumnsFromConfig(
  columnsConfig: TableConfigColumn[],
  allAttributes: Attribute[],
  attributes: Attribute[]
): TableConfigColumn[] {
  const attributeIds = attributes.map(attribute => attribute.id);

  const columns = columnsConfig.reduce<TableConfigColumn[]>((preparedColumns, column) => {
    if (column.type === TableColumnType.COMPOUND) {
      const attributeId = column.attributeIds[0];
      const attributeName = column.attributeName;
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (!attribute && !attributeName) {
        return preparedColumns;
      }

      // TODO should children not in config really appear instead of just parent?
      return preparedColumns.concat({
        ...column,
        children: attribute ? createTableColumnsFromAttributes(allAttributes, attribute, column.children) : [],
        width: column.width || DEFAULT_COLUMN_WIDTH,
      });
    }

    if (column.type === TableColumnType.HIDDEN) {
      const ids = column.attributeIds.filter(id => attributeIds.includes(id));
      if (ids.length === 0) {
        return preparedColumns;
      }
      return preparedColumns.concat({
        type: TableColumnType.HIDDEN,
        attributeIds: ids,
      });
    }

    return preparedColumns;
  }, []);

  const usedAttributeIds = columnsConfig.reduce((ids, columnConfig) => {
    if (columnConfig.attributeIds) {
      ids.push(...columnConfig.attributeIds);
    }
    return ids;
  }, []);
  const remainingAttributeIds = attributeIds.filter(id => !usedAttributeIds.includes(id));

  if (remainingAttributeIds.length === 0) {
    return mergeHiddenColumnsArray(columns);
  }

  return [
    ...mergeHiddenColumnsArray(columns),
    ...remainingAttributeIds.map(attributeId => ({
      type: TableColumnType.COMPOUND,
      attributeIds: [attributeId],
      children: [],
      width: DEFAULT_COLUMN_WIDTH,
    })),
  ];
}

export function mergeHiddenColumnsArray(columns: TableConfigColumn[]): TableConfigColumn[] {
  const mergedColumns = [];
  for (let i = 0; i < columns.length; i++) {
    const previousColumn = mergedColumns.pop();
    if (previousColumn?.type === TableColumnType.HIDDEN && columns[i].type === TableColumnType.HIDDEN) {
      const newColumn = mergeHiddenColumns(previousColumn, columns[i]);
      mergedColumns.push(newColumn);
    } else {
      if (previousColumn) {
        mergedColumns.push(previousColumn);
      }
      mergedColumns.push(columns[i]);
    }
  }
  return mergedColumns;
}

export function getAttributeIdFromColumn(column: TableConfigColumn) {
  switch (column.type) {
    case TableColumnType.COMPOUND:
      return column.attributeIds[0];
    default:
      throw Error(`Cannot get attributeId from column: ${column}`);
  }
}

export function maxColumnDepth(columns: TableConfigColumn[]): number {
  return Math.max(
    ...columns.map(column => {
      if (column.type === TableColumnType.COMPOUND) {
        return column.children.length ? maxColumnDepth(column.children) + 1 : 1;
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

export function mergeHiddenColumns(column1: TableConfigColumn, column2: TableConfigColumn): TableConfigColumn {
  if (![column1.type, column2.type].every(type => type === TableColumnType.HIDDEN)) {
    throw Error('Cannot merge two columns which are not hidden');
  }
  const attributeIds = column1.attributeIds.concat(column2.attributeIds);
  return {
    type: TableColumnType.HIDDEN,
    attributeIds,
  };
}

export function extendHiddenColumn(column: TableConfigColumn, attributeId: string): TableConfigColumn {
  if (column.type !== TableColumnType.HIDDEN) {
    throw Error('Cannot extend not hidden column');
  }
  return {
    type: TableColumnType.HIDDEN,
    attributeIds: column.attributeIds.concat(attributeId),
  };
}

export function containCompoundColumn(columns: TableConfigColumn[]): boolean {
  return columns && columns.some(column => column.type === TableColumnType.COMPOUND);
}

export function createCollectionPart(
  collection: Collection,
  index: number,
  last?: boolean,
  config?: TableConfig,
  permissions?: AllowedPermissions
): TableConfigPart {
  if (!collection) {
    return {columns: []};
  }

  const configPart = getConfigPart(config, index);
  const columnsConfig = configPart?.collectionId === collection?.id ? configPart.columns : null;

  const columns = createTableColumnsFromAttributes(collection?.attributes, null, columnsConfig);

  const lastColumn = columns[columns.length - 1];
  if (permissions?.rolesWithView?.AttributeEdit && last && (!lastColumn || lastColumn.attributeIds.length > 0)) {
    columns.push(createEmptyColumn(collection.attributes, columns));
  }

  return {
    collectionId: collection.id,
    columns,
  };
}

export function createEmptyColumn(
  attributes: Attribute[],
  columns: TableConfigColumn[],
  parentName?: string
): TableConfigColumn {
  const uninitializedAttributeNames = columns.reduce((names, column) => {
    if (column.attributeName) {
      names.push(column.attributeName);
    }
    return names;
  }, []);

  const attributeNames = (attributes || []).map(attr => attr.name);
  const attributeName = generateAttributeName([...attributeNames, ...uninitializedAttributeNames], parentName);
  return {
    type: TableColumnType.COMPOUND,
    attributeIds: [],
    attributeName,
    children: [],
    width: DEFAULT_COLUMN_WIDTH,
  };
}

export function createLinkPart(linkType: LinkType, index: number, config?: TableConfig): TableConfigPart {
  const configPart = getConfigPart(config, index);
  const columnsConfig = configPart && configPart.linkTypeId === linkType.id ? configPart.columns : null;

  const columns = createTableColumnsFromAttributes(linkType.attributes, null, columnsConfig);

  return {
    linkTypeId: linkType.id,
    columns,
  };
}

function getConfigPart(config: TableConfig, index: number): TableConfigPart {
  return config && config.parts && config.parts.length > index ? config.parts[index] : null;
}

export function maxTableColumnDepth(parts: TableConfigPart[]): number {
  return Math.max(...parts.map(part => maxColumnDepth(part.columns)));
}

export function calculateColumnRowspan(table: TableModel, partIndex: number, columnPath: number[]): number {
  const level = columnPath.length;
  const part = table.config.parts[partIndex];

  const tableColumnDepth = maxTableColumnDepth(table.config.parts);
  const maxPartDepth = maxColumnDepth(part.columns);
  const depthDifference = tableColumnDepth - maxPartDepth;
  return maxPartDepth - level + depthDifference;
}

export function resizeLastColumnChild(column: TableConfigColumn, delta: number): TableConfigColumn {
  if (column.type !== TableColumnType.COMPOUND) {
    return column;
  }

  if (column.children.length === 0) {
    return {...column, width: (column.width || DEFAULT_COLUMN_WIDTH) + delta};
  }

  const children = column.children.map((child, index) => {
    if (index === column.children.length - 1 && child.type === TableColumnType.COMPOUND) {
      return resizeLastColumnChild(child, delta);
    }
    return child;
  });

  return {...column, children};
}

export const HIDDEN_COLUMN_WIDTH = 10;

export function getTableColumnWidth(column: TableConfigColumn, showHiddenColumns: boolean): number {
  switch (column.type) {
    case TableColumnType.COMPOUND:
      return getCompoundColumnWidth(column, showHiddenColumns);
    case TableColumnType.HIDDEN:
      return showHiddenColumns ? HIDDEN_COLUMN_WIDTH : 0;
  }
}

function getCompoundColumnWidth(column: TableConfigColumn, showHiddenColumns: boolean): number {
  if (column.children.length === 0) {
    return column.width || DEFAULT_COLUMN_WIDTH;
  }

  return column.children.reduce((sum, child) => sum + getTableColumnWidth(child, showHiddenColumns), 0);
}

export function hasTableColumnChildren(column: TableConfigColumn): boolean {
  return column.children.length > 0;
}

export function isLastTableColumnChild(columns: TableConfigColumn[], path: number[]): boolean {
  if (path.length < 2) {
    return false;
  }

  const {parentPath, columnIndex} = splitColumnPath(path);
  const parent = findTableColumn(columns, parentPath);
  return columnIndex === parent.children.length - 1;
}

export function hasLastTableColumnChildHidden(column: TableConfigColumn): boolean {
  if (!hasTableColumnChildren(column)) {
    return false;
  }

  const lastColumn = getLastFromArray(column.children);
  if (lastColumn.type === TableColumnType.COMPOUND) {
    return hasLastTableColumnChildHidden(lastColumn);
  }

  return lastColumn.type === TableColumnType.HIDDEN;
}

export function filterLeafColumns(columns: TableConfigColumn[]): TableConfigColumn[] {
  return columns.reduce<TableConfigColumn[]>((leafColumns, column) => {
    if (column.type === TableColumnType.COMPOUND && column.children.length) {
      return leafColumns.concat(filterLeafColumns(column.children));
    }
    return leafColumns.concat(column);
  }, []);
}

export function calculateColumnsWidth(columns: TableConfigColumn[], showHiddenColumns: boolean): number {
  return columns.reduce((width, column) => width + getTableColumnWidth(column, showHiddenColumns), 0);
}

export function findTableRow(rows: TableConfigRow[], rowPath: number[]): TableConfigRow {
  if (!rowPath || !rows || rowPath.length === 0) {
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
  if (!row || !row.linkedRows || row.linkedRows.length === 0 || (!row.expanded && row.linkedRows.length > 1)) {
    return 1;
  }

  return row.linkedRows.reduce((count, linkedRow) => count + countLinkedRows(linkedRow), 0);
}

export function isTableRowStriped(rows: TableConfigRow[], rowPath: number[]): boolean {
  if (rowPath.length === 1) {
    return rowPath[0] % 2 === 1;
  }

  const {parentPath, rowIndex} = splitRowPath(rowPath);
  const parentRow = findTableRow(rows, parentPath);
  const last = parentRow ? rowIndex === parentRow.linkedRows.length - 1 : true;

  const parentStriped = isTableRowStriped(rows, parentPath);

  return last ? parentStriped : rowIndex % 2 === Number(!parentStriped);
}

export function isLastTableColumn(cursor: TableCursor, part: TableConfigPart): boolean {
  return (
    (cursor.columnPath && cursor.columnPath.length === 1 && cursor.columnPath[0] === part.columns.length - 1) ||
    (cursor.columnIndex && cursor.columnIndex === part.columns.length - 1)
  );
}

export function getTablePart(table: TableModel, cursor: TableCursor): TableConfigPart {
  return table.config.parts[cursor.partIndex];
}

function getTableElement(tableId: string): HTMLElement {
  return document.getElementById(`table-${tableId}`);
}

export function getTableElementFromInnerElement(element: HTMLElement, tableId: string): HTMLElement {
  const elementId = `table-${tableId}`;
  let iterations = 30; // to prevent never ending cycle
  let currentElement = element;
  while (iterations-- > 0) {
    currentElement = currentElement.parentElement;
    if (currentElement.id == elementId) {
      return currentElement;
    }
  }
  return getTableElement(tableId);
}

export function createEmptyTableRow(parentDocumentId?: string): TableConfigRow {
  return {
    correlationId: generateCorrelationId(),
    linkedRows: [],
    parentDocumentId,
  };
}

export function createTableRow(document: DocumentModel, linkInstance?: LinkInstance): TableConfigRow {
  return {
    documentId: document.id,
    linkInstanceId: linkInstance && linkInstance.id,
    linkedRows: [],
  };
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
    orderedRows.push(row);
    if (row.documentId) {
      orderedRows.push(...createRowsFromRowsMap(row.documentId, rowsMap));
    }
    return orderedRows;
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

export function filterTableColumnsByAttributes(
  columns: TableConfigColumn[],
  attributes: Attribute[]
): TableConfigColumn[] {
  const attributesMap = objectsByIdMap(attributes);
  return filterTableColumnsByAttributesMap(columns, attributesMap);
}

export function filterTableColumnsByAttributesMap(
  columns: TableConfigColumn[],
  attributesMap: Record<string, Attribute>
): TableConfigColumn[] {
  return columns.reduce((filteredColumns, column) => {
    if (column.type === TableColumnType.COMPOUND) {
      if (column.attributeIds.length === 0 && column.attributeName) {
        filteredColumns.push(column);
      } else if (attributesMap[column.attributeIds[0]]) {
        filteredColumns.push({
          ...column,
          children: filterTableColumnsByAttributesMap(column.children, attributesMap),
        });
      }
    }
    if (column.type === TableColumnType.HIDDEN) {
      const attributeIds = column.attributeIds.filter(id => !!attributesMap[id]);
      if (attributeIds.length > 0) {
        filteredColumns.push({...column, attributeIds});
      }
    }
    return filteredColumns;
  }, []);
}

/**
 * Adds new table columns based on missing attributes. If `hidden` parameter is true, they are added as a new hidden
 * column or merged with the last hidden column. Otherwise, new compound column is created for each missing attribute.
 * The columns are added after the last initialized column and before the group of uninitialized columns at the end.
 */
export function addMissingTableColumns(
  columns: TableConfigColumn[],
  attributes: Attribute[],
  hidden?: boolean
): TableConfigColumn[] {
  const usedAttributeIds = extractAttributeIdsFromTableColumns(columns);
  const missingAttributeIds = attributes.map(attribute => attribute.id).filter(id => !usedAttributeIds.includes(id));

  if (missingAttributeIds.length === 0) {
    return columns;
  }

  const index = columns.map(column => column.attributeIds.length > 0).lastIndexOf(true) + 1;
  const prefixColumns = index ? columns.slice(0, index) : columns;
  const suffixColumns = index ? columns.slice(index) : [];

  if (hidden) {
    const hiddenColumn: TableConfigColumn = {
      type: TableColumnType.HIDDEN,
      attributeIds: missingAttributeIds,
      children: [],
    };
    const previousColumn = prefixColumns[prefixColumns.length - 1];
    if (previousColumn && previousColumn.type === TableColumnType.HIDDEN) {
      return prefixColumns.slice(0, -1).concat(mergeHiddenColumns(previousColumn, hiddenColumn)).concat(suffixColumns);
    }
    return prefixColumns.concat(hiddenColumn).concat(suffixColumns);
  }

  // TODO add support for nested attributes
  return prefixColumns
    .concat(
      missingAttributeIds.map(attributeId => ({
        type: TableColumnType.COMPOUND,
        attributeIds: [attributeId],
        children: [],
        width: DEFAULT_COLUMN_WIDTH,
      }))
    )
    .concat(suffixColumns);
}

/**
 * Initializes all columns containing attributeName with existing attribute ID.
 */
export function initializeExistingTableColumns(columns: TableConfigColumn[], attributes: Attribute[]) {
  const attributeIds = new Set(extractAttributeIdsFromTableColumns(columns));

  return columns.map(column => {
    if (column.attributeName) {
      const attribute = attributes.find(attr => attr.name === column.attributeName);
      if (attribute && !attributeIds.has(attribute.id)) {
        return {...column, attributeIds: [attribute.id], attributeName: undefined};
      }
    }
    return column;
  });
}

function extractAttributeIdsFromTableColumns(columns: TableConfigColumn[]): string[] {
  return columns.reduce((attributeIds, column) => {
    attributeIds.push(...column.attributeIds);
    if (column.children) {
      attributeIds.push(...extractAttributeIdsFromTableColumns(column.children));
    }
    return attributeIds;
  }, []);
}

export function areTableColumnsListsEqual(columns: TableConfigColumn[], otherColumns: TableConfigColumn[]): boolean {
  if (columns.length !== otherColumns.length) {
    return false;
  }

  return columns.every((column, index) => {
    const otherColumn = otherColumns[index];
    if (column.type !== otherColumn.type) {
      return false;
    }
    if (column.type === TableColumnType.COMPOUND && !areTableColumnsListsEqual(column.children, otherColumn.children)) {
      return false;
    }
    return (
      column.attributeIds.length === otherColumn.attributeIds.length &&
      column.attributeIds.every(id => otherColumn.attributeIds.includes(id))
    );
  });
}

export function filterTableRowsByDepth(
  rows: TableConfigRow[],
  depth: number,
  allowedDocumentIds: string[]
): TableConfigRow[] {
  if (depth === 0) {
    return [];
  }

  return rows
    .filter(row => !row.documentId || allowedDocumentIds.includes(row.documentId))
    .map(row => {
      if (!row.linkedRows || row.linkedRows.length === 0) {
        return row;
      }

      return {...row, linkedRows: filterTableRowsByDepth(row.linkedRows, depth - 1, allowedDocumentIds)};
    });
}
