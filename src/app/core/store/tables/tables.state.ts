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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {areTableBodyCursorsEqual, areTableHeaderCursorsEqual, TableCursor} from './table-cursor';
import {TableModel} from './table.model';
import {filterLeafColumns} from './table.utils';

export interface TablesState extends EntityState<TableModel> {
  cursor: TableCursor;
  editedAttribute: EditedAttribute;
  moveCursorDown: boolean;
}

export interface EditedAttribute {
  documentId?: string;
  linkInstanceId?: string;
  attributeId: string;
}

export const tablesAdapter = createEntityAdapter<TableModel>({selectId: table => table.id});

export const initialTablesState = tablesAdapter.getInitialState({
  cursor: null,
  editedAttribute: null,
  moveCursorDown: false,
});

export const selectTablesState = (state: AppState) => state.tables;

export const selectTablesDictionary = createSelector(selectTablesState, tablesAdapter.getSelectors().selectEntities);
export const selectTableById = (tableId: string) =>
  createSelector(selectTablesDictionary, tablesDictionary => tablesDictionary[tableId]);

export const selectTableCursor = createSelector(selectTablesState, state => state.cursor);
export const selectTableCursorSelected = (cursor: TableCursor) =>
  createSelector(selectTableCursor, selectedCursor => {
    if (cursor.columnPath) {
      return areTableHeaderCursorsEqual(selectedCursor, cursor);
    } else {
      return areTableBodyCursorsEqual(selectedCursor, cursor);
    }
  });

export const selectTableBySelectedCursor = createSelector(
  selectTablesDictionary,
  selectTableCursor,
  (tablesMap, cursor) => {
    return cursor ? tablesMap[cursor.tableId] : null;
  }
);

export const selectEditedAttribute = createSelector(selectTablesState, state => state.editedAttribute);
export const selectAffected = (attribute: EditedAttribute) =>
  createSelector(selectEditedAttribute, editedAttribute => {
    return (
      attribute &&
      editedAttribute &&
      attribute.attributeId === editedAttribute.attributeId &&
      (attribute.documentId === editedAttribute.documentId ||
        attribute.linkInstanceId === editedAttribute.linkInstanceId)
    );
  });

export const selectTablePart = (tableId: string, partIndex: number) =>
  createSelector(selectTableById(tableId), table => (table ? table.parts[partIndex] : null));
export const selectTablePartLeafColumns = (tableId: string, partIndex: number) =>
  createSelector(selectTablePart(tableId, partIndex), part => (part ? filterLeafColumns(part.columns) : []));

export const selectMoveTableCursorDown = createSelector(selectTablesState, state => state.moveCursorDown);
