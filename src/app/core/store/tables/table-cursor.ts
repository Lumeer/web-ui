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
import {containCompoundColumn, findTableColumn, getTableColumns, splitColumnPath} from './table.utils';
import {TableColumn, TableColumnType, TableCompoundColumn, TableModel, TablePart} from './table.model';

export interface TableHeaderCursor {

  tableId: string;
  partIndex: number;
  columnPath: number[];

}

export interface TableBodyCursor {

  tableId: string;
  partIndex: number;
  columnIndex: number;
  rowNumber: number;

}

export type TableCursor = TableHeaderCursor;

export function moveTableCursor(table: TableModel, cursor: TableCursor, direction: Direction): TableCursor {
  switch (direction) {
    case Direction.Up:
      return moveTableCursorUp(cursor);
    case Direction.Down:
      return moveTableCursorDown(table, cursor);
    case Direction.Left:
      return moveTableCursorLeft(table, cursor);
    case Direction.Right:
      return moveTableCursorRight(table, cursor);
  }
}

function moveTableCursorUp(cursor: TableCursor): TableCursor {
  const {parentPath} = splitColumnPath(cursor.columnPath);

  if (parentPath.length > 0) {
    return {...cursor, columnPath: parentPath};
  }

  return cursor;
}

function moveTableCursorDown(table: TableModel, cursor: TableCursor): TableCursor {
  const part: TablePart = table.parts[cursor.partIndex];
  const column: TableCompoundColumn = findTableColumn(part.columns, cursor.columnPath) as TableCompoundColumn;

  const index = column.children.findIndex(column => column.type === TableColumnType.COMPOUND);

  if (index >= 0) {
    return {...cursor, columnPath: cursor.columnPath.concat(index)};
  }

  return cursor;
}

function moveTableCursorLeft(table: TableModel, cursor: TableCursor): TableCursor {
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
      return findRightMostColumn(leftSibling.column, {
        tableId: table.id,
        partIndex: part.index,
        columnPath: leftSibling.path
      }, level);
    }
  }

  return findLastColumnInPreviousPart(table, partIndex - 1, level);
}

function findLeftParentColumn(columns: TableColumn[], path: number[]): { column: TableCompoundColumn, path: number[] } {
  if (path.length === 0) {
    return null;
  }

  const leftSibling = findDirectLeftSibling(columns, path);
  if (leftSibling) {
    return leftSibling;
  }

  return findLeftParentColumn(columns, path.slice(0, path.length - 1));
}

function findDirectLeftSibling(columns: TableColumn[], path: number[]): { column: TableCompoundColumn, path: number[] } {
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
  const part = table.parts[cursor.partIndex];
  const nextParent = findNextParentColumn(part.columns, cursor.columnPath);
  if (nextParent) {
    return findLeftMostColumn(nextParent.column, {...cursor, columnPath: nextParent.path}, cursor.columnPath.length);
  }

  let nextPart = findNextPartWithColumns(table, cursor.partIndex);
  if (nextPart) {
    return findLeftMostColumn(nextPart.columns[0] as TableCompoundColumn, {...cursor, partIndex: nextPart.index, columnPath: [0]}, cursor.columnPath.length);
  }

  return cursor;
}

function findNextPartWithColumns(table: TableModel, partIndex: number): TablePart {
  let part = table.parts[partIndex + 1];
  if (!part) {
    return null;
  }

  if (!containCompoundColumn(part.columns)) {
    return findNextPartWithColumns(table, partIndex + 1);
  }

  return part;
}

function findNextParentColumn(columns: TableColumn[], path: number[]): { column: TableCompoundColumn, path: number[] } {
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

function findSideMostColumn(column: TableCompoundColumn, cursor: TableCursor, level: number, right: boolean): TableCursor {
  if (!containCompoundColumn(column.children) || cursor.columnPath.length === level) {
    return cursor;
  }

  const index = right ? column.children.length - 1 : 0;
  const nextColumn = column.children[index] as TableCompoundColumn; // TODO different types of columns
  const nextCursor = {...cursor, columnPath: cursor.columnPath.concat(index)};
  return findSideMostColumn(nextColumn, nextCursor, level, right);
}
