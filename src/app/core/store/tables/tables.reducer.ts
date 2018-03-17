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
import {TableHeaderCursor} from './table-cursor';
import {SelectedTableCell, TableColumn, TableModel, TablePart} from './table.model';
import {addTableColumn, maxColumnDepth, moveTableColumn, replaceTableColumns} from './table.utils';
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
    case TablesActionType.SELECT_COLUMN:
      return selectColumn(state, action);
    case TablesActionType.DESELECT:
      return tablesAdapter.updateOne({id: action.payload.tableId, changes: {selectedCell: null}}, state);
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
  return updateColumns(state, action.payload.cursor, (columns) => {
    const fromPath = action.payload.cursor.columnPath;
    const toPath = fromPath.slice(0, fromPath.length - 1).concat(action.payload.toIndex);
    return moveTableColumn(columns, fromPath, toPath);
  }, true);
}

function selectColumn(state: TablesState, action: TablesAction.SelectColumn): TablesState {
  const {table} = getTablePart(state, action.payload.cursor);

  const selectedCell: SelectedTableCell = {
    partIndex: action.payload.cursor.partIndex,
    columnPath: action.payload.cursor.columnPath
  };
  return tablesAdapter.updateOne({id: table.id, changes: {...table, selectedCell}}, state);
}

function updateColumns(state: TablesState,
                       cursor: TableHeaderCursor,
                       transformation: (columns: TableColumn[]) => TableColumn[],
                       unselect?: boolean) {
  const {table, part} = getTablePart(state, cursor);

  const columns = transformation(part.columns);
  const columnDepth = maxColumnDepth(columns);
  const parts: TablePart[] = copyAndSpliceArray(table.parts, cursor.partIndex, 1, {...part, columns, columnDepth});

  const changes: Partial<TableModel> = {parts};
  if (unselect) {
    changes.selectedCell = null;
  }
  return tablesAdapter.updateOne({id: table.id, changes}, state);
}

export function getTablePart(state: TablesState, cursor: TableHeaderCursor): { table: TableModel, part: TablePart } {
  const table = state.entities[cursor.tableId];
  const part = table.parts[cursor.partIndex];
  return {table, part};
}
