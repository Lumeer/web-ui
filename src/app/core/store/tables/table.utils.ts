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
import {filterDirectAttributeChildren, findAttributeByName, splitAttributeName} from '../../../shared/utils/attribute.utils';
import {AttributeModel, CollectionModel} from '../collections/collection.model';
import {LinkTypeModel} from '../link-types/link-type.model';
import {TableColumn, TableColumnType, TableCompoundColumn, TableConfig, TableConfigColumn, TableConfigPart, TableHiddenColumn, TableModel, TablePart, TableRow, TableSingleColumn} from './table.model';

export function findTableColumn(columns: TableColumn[], path: number[]): TableColumn {
  const index = getColumnIndex(path);

  if (path.length === 1) {
    return columns[index];
  }

  const column = columns[index] as TableCompoundColumn;
  return findTableColumn(column.children, path.slice(1));
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

export function replaceTableColumns(columns: TableColumn[], path: number[], deleteCount: number, addedColumns: TableColumn[] = []): TableColumn[] {
  const index = getColumnIndex(path);

  if (path.length === 1) {
    if (addedColumns && addedColumns.length) {
      return copyAndSpliceArray(columns, index, deleteCount, ...addedColumns);
    } else {
      return copyAndSpliceArray(columns, index, 1);
    }
  }

  const oldColumn = columns[index] as TableCompoundColumn;
  const newColumn = {...oldColumn, children: replaceTableColumns(oldColumn.children, path.slice(1), deleteCount, addedColumns)};
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

export function createTableColumnsBySiblingAttributeIds(allAttributes: AttributeModel[],
                                                        attributeIds: string[]): TableColumn[] {
  if (!attributeIds || attributeIds.length === 0) {
    return [];
  }

  const attributeNames = allAttributes.filter(attribute => attributeIds.includes(attribute.id))
    .map(attribute => attribute.name);

  const attributes = allAttributes
    .filter(attribute => attributeNames.some(name => attribute.name.startsWith(name)));

  const {parentName} = splitAttributeName(attributeNames[0]);
  if (!parentName) {
    return createTableColumnsFromAttributes(attributes);
  }

  const parent = findAttributeByName(allAttributes, parentName);
  return createTableColumnsFromAttributes(attributes, parent);
}

export function createTableColumnsFromAttributes(allAttributes: AttributeModel[],
                                                 parentAttribute?: AttributeModel,
                                                 columnsConfig: TableConfigColumn[] = []): TableColumn[] {
  const attributes = filterDirectAttributeChildren(allAttributes, parentAttribute);

  if (columnsConfig && columnsConfig.length) {
    return createColumnsFromConfig(columnsConfig, allAttributes, attributes);
  }

  return attributes.map((attribute) => {
    const parent = new TableSingleColumn(attribute.id);
    const children = createTableColumnsFromAttributes(allAttributes, attribute);
    return new TableCompoundColumn(parent, children);
  });
}

function createColumnsFromConfig(columnsConfig: TableConfigColumn[],
                                 allAttributes: AttributeModel[],
                                 attributes: AttributeModel[]): TableColumn[] {
  const attributeIds = attributes.map(attribute => attribute.id);

  const columns = columnsConfig.reduce<TableColumn[]>((columns, column) => {
    if (column.type === TableColumnType.COMPOUND) {
      const attributeId = column.attributeIds[0];
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (!attribute) {
        return columns;
      }

      const parent = new TableSingleColumn(attributeId, null, column.width);
      // TODO should children not in config really appear instead of just parent?
      const children = createTableColumnsFromAttributes(allAttributes, attribute, column.children);
      return columns.concat(new TableCompoundColumn(parent, children));
    }

    if (column.type === TableColumnType.HIDDEN) {
      const ids = column.attributeIds.filter(id => attributeIds.includes(id));
      return ids.length ? columns.concat(new TableHiddenColumn(ids)) : columns;
    }

    return columns;
  }, []);

  const usedAttributeIds = columnsConfig.reduce((attributeIds, columnConfig) => {
    return columnConfig.attributeIds ? attributeIds.concat(columnConfig.attributeIds) : attributeIds;
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
  return Math.max(...columns.map(column => {
    if (column.type === TableColumnType.COMPOUND) {
      const children = (column as TableCompoundColumn).children;
      return children.length ? maxColumnDepth(children) + 1 : 1;
    }
    return 1;
  }));
}

export function splitColumnPath(path: number[]): { parentPath: number[], columnIndex: number } {
  if (!path || !path.length) {
    throw Error('Invalid table column path');
  }

  return {
    parentPath: path.slice(0, path.length - 1),
    columnIndex: path[path.length - 1]
  };
}

export function splitRowPath(rowPath: number[]): { parentPath: number[], rowIndex: number } {
  if (!rowPath || !rowPath.length) {
    throw Error('Invalid table column path');
  }

  return {
    parentPath: rowPath.slice(0, -1),
    rowIndex: rowPath[rowPath.length - 1]
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

export function createCollectionPart(collection: CollectionModel, index: number, config?: TableConfig): TablePart {
  const configPart = getConfigPart(config, index);
  const columnsConfig = configPart && configPart.collectionId === collection.id ? configPart.columns : null;

  const columns = createTableColumnsFromAttributes(collection.attributes, null, columnsConfig);
  const columnDepth = maxColumnDepth(columns);

  return {
    index,
    collectionId: collection.id,
    columns,
    columnDepth
  };
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
    columnDepth
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

export const HIDDEN_COLUMN_WIDTH = 8;

export function getTableColumnWidth(column: TableColumn): number {
  switch (column.type) {
    case TableColumnType.COMPOUND:
      return getCompoundColumnWidth(column as TableCompoundColumn);
    case TableColumnType.HIDDEN:
      return HIDDEN_COLUMN_WIDTH;
    case TableColumnType.SINGLE:
      return (column as TableSingleColumn).width;
  }
}

function getCompoundColumnWidth(column: TableCompoundColumn): number {
  if (column.children.length === 0) {
    return column.parent.width;
  }

  return column.children.reduce((sum, child) => sum + getTableColumnWidth(child), 0);
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

export function calculateColumnsWidth(columns: TableColumn[]): number {
  return columns.reduce((width, column) => width + getTableColumnWidth(column), 0);
}

export function findTableRow(rows: TableRow[], rowPath: number[]): TableRow {
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

export function getTableRowsByPart(rows: TableRow[], currentIndex: number, partIndex: number): TableRow[] {
  if (currentIndex === partIndex) {
    return rows;
  }

  return rows.reduce((linkedRows, row) => {
    if (row.linkedRows && row.linkedRows.length > 0) {
      return linkedRows.concat(row.linkedRows);
    }
    return linkedRows;
  }, []);
}

export function calculateRowNumber(table: TableModel, rowIndex: number): number {
  if (rowIndex === 0) {
    return 1;
  }

  const previousRow = table.rows[rowIndex - 1];
  return calculateRowNumber(table, rowIndex - 1) + countLinkedRows(previousRow);
}

export function countLinkedRows(row: TableRow): number {
  if (!row.linkedRows || row.linkedRows.length === 0) {
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
