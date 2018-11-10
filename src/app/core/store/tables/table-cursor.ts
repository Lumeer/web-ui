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

import {Direction} from '../../../shared/direction';
import {arrayStartsWith, deepArrayEquals, getLastFromArray} from '../../../shared/utils/array.utils';
import {TableColumn, TableColumnType, TableCompoundColumn, TableConfigRow, TableModel, TablePart} from './table.model';
import {
  containCompoundColumn,
  filterLeafColumns,
  findTableColumn,
  findTableColumnByIndex,
  findTableRow,
  getTableColumns,
  isTableRowExpanded,
  splitColumnPath,
  splitRowPath,
} from './table.utils';

export interface TableHeaderCursor {
  tableId: string;
  partIndex: number;
  columnPath?: number[];
}

export interface TableBodyCursor {
  tableId: string;
  rowPath?: number[];
  partIndex: number;
  columnIndex?: number;
}

export type TableCursor = TableHeaderCursor & TableBodyCursor;

export function moveTableCursor(table: TableModel, cursor: TableCursor, direction: Direction): TableCursor {
  switch (direction) {
    case Direction.Up:
      return moveTableCursorUp(table, cursor);
    case Direction.Down:
      return moveTableCursorDown(table, cursor);
    case Direction.Left:
      return moveTableCursorLeft(table, cursor);
    case Direction.Right:
      return moveTableCursorRight(table, cursor);
  }
}

const COLLAPSED_ROWS_INCLUDED = true;

function moveTableCursorUp(table: TableModel, cursor: TableCursor): TableCursor {
  if (cursor.columnPath) {
    return moveTableHeaderCursorUp(cursor);
  }

  return moveTableBodyCursorUp(table, cursor);
}

function moveTableBodyCursorUp(table: TableModel, cursor: TableBodyCursor): TableCursor {
  const parentRowPath = getPreviousParentRowPath(table.config.rows, cursor.rowPath);
  const parentRow = findTableRow(table.config.rows, parentRowPath);

  if (!parentRow) {
    return {
      tableId: cursor.tableId,
      partIndex: cursor.partIndex,
      columnPath: [cursor.columnIndex], // TODO nested attributes
    };
  }

  const {rowPath} = findLastLinkedRow(parentRow, parentRowPath, cursor.rowPath.length);
  if (!COLLAPSED_ROWS_INCLUDED || rowPath.length === 1 || isTableRowExpanded(table.config.rows, parentRowPath)) {
    return {...cursor, rowPath};
  } else {
    return {...cursor, rowPath: parentRowPath.concat(0)};
  }
}

function getPreviousParentRowPath(rows: TableConfigRow[], rowPath: number[]): number[] {
  if (rowPath.length === 0) {
    return null;
  }

  const {parentPath, rowIndex} = splitRowPath(rowPath);

  if (rowIndex > 0 && (!COLLAPSED_ROWS_INCLUDED || isTableRowExpanded(rows, parentPath))) {
    return parentPath.concat(rowIndex - 1);
  }

  return getPreviousParentRowPath(rows, parentPath);
}

function findLastLinkedRow(
  row: TableConfigRow,
  rowPath: number[],
  depth: number
): {row: TableConfigRow; rowPath: number[]} {
  if (rowPath.length === depth) {
    return {row, rowPath};
  }

  // if (!COLLAPSED_ROWS_INCLUDED || isTableRowExpanded(table.config.rows, parentRowPath)) {
  // TODO just workaround for not existing rows
  if (!row.linkedRows || row.linkedRows.length === 0) {
    const tail = Array(depth - rowPath.length).fill(0);
    return {row: null, rowPath: rowPath.concat(tail)};
  }

  const nextRow = getLastFromArray(row.linkedRows);
  const nextRowPath = rowPath.concat(row.linkedRows.length - 1);
  return findLastLinkedRow(nextRow, nextRowPath, depth);
}

function moveTableHeaderCursorUp(cursor: TableHeaderCursor): TableCursor {
  const {parentPath} = splitColumnPath(cursor.columnPath);

  if (parentPath.length > 0) {
    return {...cursor, columnPath: parentPath};
  }

  return cursor;
}

function moveTableCursorDown(table: TableModel, cursor: TableCursor): TableCursor {
  if (cursor.columnPath) {
    return moveTableHeaderCursorDown(table, cursor);
  }

  return moveTableBodyCursorDown(table, cursor);
}

function moveTableBodyCursorDown(table: TableModel, cursor: TableBodyCursor): TableCursor {
  const parentRowPath = getNextParentRowPath(table, cursor.rowPath);
  if (!parentRowPath) {
    return cursor;
  }

  const tail = Array(cursor.rowPath.length - parentRowPath.length).fill(0);
  return {...cursor, rowPath: parentRowPath.concat(tail)};
}

function getNextParentRowPath(table: TableModel, rowPath: number[]): number[] {
  if (rowPath.length === 0) {
    return null;
  }

  const {parentPath, rowIndex} = splitRowPath(rowPath);

  if (!COLLAPSED_ROWS_INCLUDED || isTableRowExpanded(table.config.rows, parentPath)) {
    const nextRowPath = parentPath.concat(rowIndex + 1);
    const row = findTableRow(table.config.rows, nextRowPath);
    if (row) {
      return nextRowPath;
    }
  }

  return getNextParentRowPath(table, parentPath);
}

function moveTableHeaderCursorDown(table: TableModel, cursor: TableHeaderCursor): TableCursor {
  const part: TablePart = table.parts[cursor.partIndex];
  const column: TableCompoundColumn = findTableColumn(part.columns, cursor.columnPath) as TableCompoundColumn;

  const index = column.children.findIndex(c => c.type === TableColumnType.COMPOUND);

  if (index >= 0) {
    return {...cursor, columnPath: cursor.columnPath.concat(index)};
  }

  return {
    tableId: cursor.tableId,
    partIndex: cursor.partIndex,
    columnIndex: cursor.columnPath[0], // TODO nested attributes
    rowPath: Array(cursor.partIndex / 2 + 1).fill(0), // TODO check link instance parts
  };
}

function moveTableCursorLeft(table: TableModel, cursor: TableCursor): TableCursor {
  if (cursor.columnPath) {
    return moveTableHeaderCursorLeft(table, cursor);
  }

  return moveTableBodyCursorLeft(table, cursor);
}

function moveTableBodyCursorLeft(table: TableModel, cursor: TableBodyCursor): TableCursor {
  if (cursor.columnIndex > 0) {
    return moveTableBodyCursorLeftWithinPart(table, cursor);
  }

  return moveTableBodyCursorLeftToPreviousPart(table, cursor);
}

function moveTableBodyCursorLeftWithinPart(table: TableModel, cursor: TableBodyCursor): TableCursor {
  const {columns} = table.parts[cursor.partIndex];
  const nextCursor = {...cursor, columnIndex: cursor.columnIndex - 1};

  const nextColumn = findTableColumnByIndex(columns, nextCursor.columnIndex);
  if (nextColumn && nextColumn.type === TableColumnType.HIDDEN) {
    return moveTableBodyCursorLeft(table, nextCursor);
  }

  return nextCursor;
}

function moveTableBodyCursorLeftToPreviousPart(table: TableModel, cursor: TableBodyCursor): TableCursor {
  if (cursor.partIndex === 0) {
    return cursor;
  }

  const partIndex = cursor.partIndex - 2; // TODO link instance parts
  const {columns} = table.parts[partIndex];
  const nextCursor = {
    ...cursor,
    partIndex,
    columnIndex: filterLeafColumns(columns).length - 1,
    rowPath: cursor.rowPath.slice(0, -1),
  };

  const nextColumn = findTableColumnByIndex(columns, partIndex);
  if (nextColumn && nextColumn.type === TableColumnType.HIDDEN) {
    return moveTableBodyCursorLeft(table, nextCursor);
  }

  return nextCursor;
}

function moveTableHeaderCursorLeft(table: TableModel, cursor: TableHeaderCursor): TableCursor {
  const part = table.parts[cursor.partIndex];

  const parent = findLeftParentColumn(part.columns, cursor.columnPath);
  if (parent) {
    return findRightMostColumn(parent.column, {...cursor, columnPath: parent.path}, cursor.columnPath.length);
  }

  const previousPartCursor = findLastColumnInPreviousPart(table, cursor.partIndex, cursor.columnPath.length);
  if (previousPartCursor) {
    return previousPartCursor;
  }

  return cursor;
}

function findLastColumnInPreviousPart(table: TableModel, partIndex: number, level: number): TableCursor {
  if (partIndex === 0) {
    return null;
  }

  const part = table.parts[partIndex - 1];
  if (part.columns.length) {
    const leftSibling = findDirectLeftSibling(part.columns, [part.columns.length]);
    if (leftSibling) {
      return findRightMostColumn(
        leftSibling.column,
        {
          tableId: table.id,
          partIndex: part.index,
          columnPath: leftSibling.path,
        },
        level
      );
    }
  }

  return findLastColumnInPreviousPart(table, partIndex - 1, level);
}

function findLeftParentColumn(columns: TableColumn[], path: number[]): {column: TableCompoundColumn; path: number[]} {
  if (path.length === 0) {
    return null;
  }

  const leftSibling = findDirectLeftSibling(columns, path);
  if (leftSibling) {
    return leftSibling;
  }

  return findLeftParentColumn(columns, path.slice(0, path.length - 1));
}

function findDirectLeftSibling(columns: TableColumn[], path: number[]): {column: TableCompoundColumn; path: number[]} {
  const {parentPath, columnIndex} = splitColumnPath(path);

  const siblingColumns = getTableColumns(columns, parentPath);

  for (let index = columnIndex - 1; index >= 0; index--) {
    const column = siblingColumns[index];
    if (column.type === TableColumnType.COMPOUND) {
      return {column: column as TableCompoundColumn, path: parentPath.concat(index)};
    }
  }

  return null;
}

function moveTableCursorRight(table: TableModel, cursor: TableCursor): TableCursor {
  if (cursor.columnPath) {
    return moveTableHeaderCursorRight(table, cursor);
  }

  return moveTableBodyCursorRight(table, cursor);
}

function moveTableBodyCursorRight(table: TableModel, cursor: TableBodyCursor): TableCursor {
  const {columns} = table.parts[cursor.partIndex];
  const lastColumnIndex = columns.length - 1;
  if (cursor.columnIndex < lastColumnIndex) {
    return moveTableBodyCursorRightWithinPart(table, cursor);
  }

  return moveTableBodyCursorRightToNextPart(table, cursor);
}

function moveTableBodyCursorRightWithinPart(table: TableModel, cursor: TableBodyCursor) {
  const {columns} = table.parts[cursor.partIndex];
  const nextCursor = {...cursor, columnIndex: cursor.columnIndex + 1};

  const nextColumn = findTableColumnByIndex(columns, nextCursor.columnIndex);
  if (nextColumn && nextColumn.type === TableColumnType.HIDDEN) {
    return moveTableBodyCursorRight(table, nextCursor);
  }

  return nextCursor;
}

function moveTableBodyCursorRightToNextPart(table: TableModel, cursor: TableBodyCursor) {
  const nextCursor = {
    ...cursor,
    partIndex: cursor.partIndex + 2, // TODO link instance parts
    columnIndex: 0,
    rowPath: cursor.rowPath.concat(0),
  };

  if (table.parts.length - 1 < nextCursor.partIndex) {
    return cursor;
  }

  const {columns} = table.parts[nextCursor.partIndex];
  const nextColumn = findTableColumnByIndex(columns, nextCursor.columnIndex);
  if (nextColumn && nextColumn.type === TableColumnType.HIDDEN) {
    return moveTableBodyCursorRight(table, nextCursor);
  }

  return nextCursor;
}

function moveTableHeaderCursorRight(table: TableModel, cursor: TableHeaderCursor): TableCursor {
  const part = table.parts[cursor.partIndex];
  const nextParent = findNextParentColumn(part.columns, cursor.columnPath);
  if (nextParent) {
    return findLeftMostColumn(nextParent.column, {...cursor, columnPath: nextParent.path}, cursor.columnPath.length);
  }

  const nextPart = findNextPartWithColumns(table, cursor.partIndex);
  if (nextPart) {
    return findLeftMostColumn(
      nextPart.columns[0] as TableCompoundColumn,
      {...cursor, partIndex: nextPart.index, columnPath: [0]},
      cursor.columnPath.length
    );
  }

  return cursor;
}

function findNextPartWithColumns(table: TableModel, partIndex: number): TablePart {
  const part = table.parts[partIndex + 1];
  if (!part) {
    return null;
  }

  if (!containCompoundColumn(part.columns)) {
    return findNextPartWithColumns(table, partIndex + 1);
  }

  return part;
}

function findNextParentColumn(columns: TableColumn[], path: number[]): {column: TableCompoundColumn; path: number[]} {
  if (columns.length === 0 || path.length === 0) {
    return null;
  }

  const nextPath = [...path];
  nextPath[nextPath.length - 1] += 1;
  const nextColumn = findTableColumn(columns, nextPath);
  if (nextColumn) {
    if (nextColumn.type === TableColumnType.COMPOUND) {
      return {column: nextColumn as TableCompoundColumn, path: nextPath};
    }
    return findNextParentColumn(columns, nextPath);
  }

  return findNextParentColumn(columns, path.slice(0, path.length - 1));
}

function findRightMostColumn(column: TableCompoundColumn, cursor: TableCursor, level: number): TableCursor {
  return findSideMostColumn(column, cursor, level, true);
}

function findLeftMostColumn(column: TableCompoundColumn, cursor: TableCursor, level: number): TableCursor {
  return findSideMostColumn(column, cursor, level, false);
}

function findSideMostColumn(
  column: TableCompoundColumn,
  cursor: TableCursor,
  level: number,
  right: boolean
): TableCursor {
  if (!containCompoundColumn(column.children) || cursor.columnPath.length === level) {
    return cursor;
  }

  const index = right ? column.children.length - 1 : 0;
  const nextColumn = column.children[index] as TableCompoundColumn; // TODO different types of columns
  const nextCursor = {...cursor, columnPath: cursor.columnPath.concat(index)};
  return findSideMostColumn(nextColumn, nextCursor, level, right);
}

export function areTableCursorsEqual(cursor1: TableCursor, cursor2: TableCursor): boolean {
  if (cursor2.columnPath) {
    return areTableHeaderCursorsEqual(cursor1, cursor2);
  } else {
    return areTableBodyCursorsEqual(cursor1, cursor2);
  }
}

export function areTableHeaderCursorsEqual(cursor1: TableHeaderCursor, cursor2: TableHeaderCursor): boolean {
  return (
    cursor1 &&
    cursor2 &&
    cursor1.tableId === cursor2.tableId &&
    cursor1.partIndex === cursor2.partIndex &&
    deepArrayEquals(cursor1.columnPath, cursor2.columnPath)
  );
}

export function isTableColumnSubPath(parent: TableHeaderCursor, child: TableHeaderCursor): boolean {
  return (
    parent &&
    child &&
    parent.tableId === child.tableId &&
    parent.partIndex === child.partIndex &&
    arrayStartsWith(child.columnPath, parent.columnPath)
  );
}

export function areTableBodyCursorsEqual(cursor1: TableBodyCursor, cursor2: TableBodyCursor): boolean {
  return (
    cursor1 &&
    cursor2 &&
    cursor1.tableId === cursor2.tableId &&
    cursor1.partIndex === cursor2.partIndex &&
    cursor1.columnIndex === cursor2.columnIndex &&
    deepArrayEquals(cursor1.rowPath, cursor2.rowPath)
  );
}

export function areTableRowCursorsEqual(cursor1: TableBodyCursor, cursor2: TableBodyCursor): boolean {
  return (
    cursor1 &&
    cursor2 &&
    cursor1.tableId === cursor2.tableId &&
    cursor1.partIndex === cursor2.partIndex &&
    deepArrayEquals(cursor1.rowPath, cursor2.rowPath)
  );
}

export function findTableColumnWithCursor(
  table: TableModel,
  partIndex: number,
  attributeName: string
): {column: TableCompoundColumn; cursor: TableHeaderCursor} {
  const columns = table.parts[partIndex].columns;
  const startingCursor: TableHeaderCursor = {tableId: table.id, partIndex, columnPath: []};
  const cursor = getTableHeaderCursor(columns, attributeName, startingCursor);
  const column = findTableColumn(columns, cursor.columnPath) as TableCompoundColumn;
  return {column, cursor};
}

function getTableHeaderCursor(
  columns: TableColumn[],
  attributeName: string,
  cursor: TableHeaderCursor
): TableHeaderCursor {
  return columns.reduce<TableHeaderCursor>((foundCursor, column, index) => {
    if (foundCursor) {
      return foundCursor;
    }

    if (column.type !== TableColumnType.COMPOUND) {
      return null;
    }

    const currentCursor = {...cursor, columnPath: cursor.columnPath.concat(index)};

    const compoundColumn = column as TableCompoundColumn;
    if (compoundColumn.parent.attributeName === attributeName) {
      return currentCursor;
    }

    return getTableHeaderCursor(compoundColumn.children, attributeName, currentCursor);
  }, null);
}

export function getTableRowCursor(cursor: TableBodyCursor, indexDelta: number): TableBodyCursor {
  const {parentPath, rowIndex} = splitRowPath(cursor.rowPath);
  const rowPath = parentPath.concat(rowIndex + indexDelta);
  return {...cursor, rowPath};
}
