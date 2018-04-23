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

import {copyAndSpliceArray} from '../../../shared/utils/array.utils';
import {TableBodyCursor, TableHeaderCursor} from './table-cursor';
import {EMPTY_TABLE_ROW, TableColumn, TableModel, TablePart, TableRow} from './table.model';
import {addTableColumn, maxColumnDepth, moveTableColumn, replaceTableColumns, splitRowPath} from './table.utils';
import {TablesAction, TablesActionType} from './tables.action';
import {initialTablesState, tablesAdapter, TablesState} from './tables.state';

export function tablesReducer(state = initialTablesState(), action: TablesAction.All): TablesState {
  switch (action.type) {
    case TablesActionType.ADD_TABLE:
      return tablesAdapter.addOne(action.payload.table, state);
    case TablesActionType.REMOVE_TABLE:
      return tablesAdapter.removeOne(action.payload.tableId, state);
    case TablesActionType.ADD_PART:
      return addPart(state, action);
    case TablesActionType.ADD_COLUMN:
      return addColumn(state, action);
    case TablesActionType.REPLACE_COLUMNS:
      return replaceColumn(state, action);
    case TablesActionType.MOVE_COLUMN:
      return moveColumn(state, action);
    case TablesActionType.ADD_ROWS:
      return addRows(state, action);
    case TablesActionType.ADD_LINKED_ROWS:
      return addLinkedRows(state, action);
    case TablesActionType.REPLACE_ROWS:
      return replaceRows(state, action);
    case TablesActionType.REMOVE_ROW:
      return removeRow(state, action);
    case TablesActionType.SET_CURSOR:
      return setCursor(state, action);
    case TablesActionType.SET_EDITED_ATTRIBUTE:
      return {...state, editedAttribute: action.payload.editedAttribute};
    default:
      return state;
  }
}

function addPart(state: TablesState, action: TablesAction.AddPart): TablesState {
  const table = state.entities[action.payload.tableId];
  const parts = table.parts.concat(action.payload.parts);
  return tablesAdapter.updateOne({id: table.id, changes: {parts}}, state);
}

function addColumn(state: TablesState, action: TablesAction.AddColumn): TablesState {
  return updateColumns(state, action.payload.cursor, (columns) => {
    return addTableColumn(columns, action.payload.cursor.columnPath, action.payload.column);
  });
}

function replaceColumn(state: TablesState, action: TablesAction.ReplaceColumns): TablesState {
  return updateColumns(state, action.payload.cursor, (columns) => {
    return replaceTableColumns(columns, action.payload.cursor.columnPath, action.payload.deleteCount, action.payload.columns);
  });
}

function moveColumn(state: TablesState, action: TablesAction.MoveColumn): TablesState {
  return updateColumns({...state, cursor: null}, action.payload.cursor, (columns) => {
    const fromPath = action.payload.cursor.columnPath;
    const toPath = fromPath.slice(0, fromPath.length - 1).concat(action.payload.toIndex);
    return moveTableColumn(columns, fromPath, toPath);
  });
}

function updateColumns(state: TablesState,
                       cursor: TableHeaderCursor,
                       transformation: (columns: TableColumn[]) => TableColumn[]) {
  const {table, part} = getTablePart(state, cursor);

  const columns = transformation(part.columns);
  const columnDepth = maxColumnDepth(columns);
  const parts: TablePart[] = copyAndSpliceArray(table.parts, cursor.partIndex, 1, {...part, columns, columnDepth});

  return tablesAdapter.updateOne({id: table.id, changes: {parts}}, state);
}

function addRows(state: TablesState, action: TablesAction.AddRows): TablesState {
  const cursor = action.payload.cursor;
  const {table} = getTablePart(state, cursor);

  // TODO sort
  // TODO linked rows (get through path)
  const previousRow = table.rows[cursor.rowPath[0] - 1];
  const rows = [...table.rows];
  const addedRows = action.payload.rows.filter(row => !table.documentIds.has(row.documentIds[0]));

  if (previousRow.documentIds.length > 0) {
    rows.splice(cursor.rowPath[0], 0, ...addedRows);
  } else {
    rows.splice(cursor.rowPath[0] - 1, 1, ...addedRows);
  }

  const documentIds = new Set(table.documentIds);
  addedRows.forEach(row => documentIds.add(row.documentIds[0]));

  return tablesAdapter.updateOne({id: table.id, changes: {rows, documentIds}}, state);
}

function addLinkedRows(state: TablesState, action: TablesAction.AddLinkedRows): TablesState {
  const {cursor, linkedRows} = action.payload;
  const {table} = getTablePart(state, cursor);

  const rows = updateLinkedRows(table.rows, linkedRows, cursor.rowPath);
  return tablesAdapter.updateOne({id: table.id, changes: {rows}}, state);
}

function updateLinkedRows(rows: TableRow[], linkedRows: TableRow[], rowPath: number[]): TableRow[] {
  if (rowPath.length === 0) {
    return linkedRows;
  }

  const [index, ...childPath] = rowPath;
  // TODO just add, do not override
  const row = {...rows[index], linkedRows: updateLinkedRows(rows[index].linkedRows, linkedRows, childPath)};
  const newRows = [...rows];
  newRows.splice(index, 1, row);
  return newRows;
}

function replaceRows(state: TablesState, action: TablesAction.ReplaceRows): TablesState {
  const cursor = action.payload.cursor;
  const {table} = getTablePart(state, cursor);

  const addedRows = action.payload.rows;
  const rows = updateRows(table.rows, cursor.rowPath, updatedRows => {
    const {rowIndex} = splitRowPath(cursor.rowPath);
    updatedRows.splice(rowIndex, action.payload.deleteCount, ...addedRows);
    return updatedRows;
  });

  const documentIds = new Set(table.documentIds);
  if (cursor.partIndex === 0) {
    addedRows.forEach(row => documentIds.add(row.documentIds[0]));
  }

  return tablesAdapter.updateOne({id: table.id, changes: {rows, documentIds}}, state);
}

function updateRows(rows: TableRow[],
                    rowPath: number[],
                    transformation: (rows: TableRow[]) => TableRow[]): TableRow[] {
  if (rowPath.length === 1) {
    return transformation([...rows]);
  }

  const [index, ...childPath] = rowPath;
  const row = {...rows[index], linkedRows: updateRows(rows[index].linkedRows, childPath, transformation)};
  const updatedRows = [...rows];
  updatedRows.splice(index, 1, row);
  return updatedRows;
}

export function removeRow(state: TablesState, action: TablesAction.RemoveRow): TablesState {
  const cursor = action.payload.cursor;
  const {table} = getTablePart(state, cursor);

  const rows = removeLinkedRow(table.rows, cursor.rowPath);
  return tablesAdapter.updateOne({id: table.id, changes: {rows}}, state);
}

function removeLinkedRow(rows: TableRow[], rowPath: number[]): TableRow[] {
  const updatedRows = [...rows];
  const rowIndex = rowPath[0];

  if (rowPath.length === 1) {
    updatedRows.splice(rowIndex, 1);
    return updatedRows;
  }

  const row = {...rows[rowIndex]};
  row.linkedRows = removeLinkedRow(row.linkedRows, rowPath.slice(1));
  updatedRows.splice(rowIndex, 1, row);
  return updatedRows;
}

export function setCursor(state: TablesState, action: TablesAction.SetCursor): TablesState {
  const cursor = action.payload.cursor;

  if (cursor && cursor.rowPath) {
    const {table} = getTablePart(state, cursor);
    if (table.parts.length === 1 && isLastInitializedRow(table, cursor)) {
      const rows = table.rows.concat(EMPTY_TABLE_ROW);
      return tablesAdapter.updateOne({id: table.id, changes: {rows}}, {...state, cursor});
    }
  }
  return {...state, cursor};
}

function isLastInitializedRow(table: TableModel, cursor: TableBodyCursor): boolean {
  return Boolean(cursor.rowPath.length === 1
    && cursor.rowPath[0] === table.rows.length - 1
    && table.rows[table.rows.length - 1].documentIds.length);
}

export function getTablePart(state: TablesState, cursor: TableHeaderCursor): { table: TableModel, part: TablePart } {
  const table = state.entities[cursor.tableId];
  const part = table.parts[cursor.partIndex];
  return {table, part};
}
