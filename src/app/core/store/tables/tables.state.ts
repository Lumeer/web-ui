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
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {areTableBodyCursorsEqual, areTableHeaderCursorsEqual, TableCursor} from './table-cursor';
import {TableModel} from './table.model';
import {filterLeafColumns} from './table.utils';

export const TABLE_FEATURE_NAME = 'tables';

export interface TablesState extends EntityState<TableModel> {

  cursor: TableCursor;
  editedAttribute: EditedAttribute;

}

export interface EditedAttribute {

  documentId?: string;
  linkInstanceId?: string;
  attributeId: string;

}

export const tablesAdapter = createEntityAdapter<TableModel>({selectId: table => table.id});

export function initialTablesState(): TablesState {
  return tablesAdapter.getInitialState({
    cursor: null,
    editedAttribute: null
  });
}

export const selectTablesState = createFeatureSelector<TablesState>(TABLE_FEATURE_NAME);

export const selectTablesDictionary = createSelector(selectTablesState, tablesAdapter.getSelectors().selectEntities);
export const selectTableById = (tableId: string) =>
  createSelector(selectTablesDictionary, tablesDictionary => tablesDictionary[tableId]);

export const selectTableCursor = createSelector(selectTablesState, state => state.cursor);
export const selectTableCursorSelected = (cursor: TableCursor) => createSelector(selectTableCursor, selectedCursor => {
  if (cursor.columnPath) {
    return areTableHeaderCursorsEqual(selectedCursor, cursor);
  } else {
    return areTableBodyCursorsEqual(selectedCursor, cursor);
  }
});

export const selectEditedAttribute = createSelector(selectTablesState, state => state.editedAttribute);
export const selectAffected = (attribute: EditedAttribute) => createSelector(selectEditedAttribute, editedAttribute => {
  return attribute && editedAttribute &&
    attribute.documentId === editedAttribute.documentId &&
    attribute.linkInstanceId === editedAttribute.linkInstanceId &&
    attribute.attributeId === editedAttribute.attributeId;
});

export const selectTablePart = (tableId: string, partIndex: number) =>
  createSelector(selectTableById(tableId), table => table ? table.parts[partIndex] : null);
export const selectTablePartLeafColumns = (tableId: string, partIndex: number) =>
  createSelector(selectTablePart(tableId, partIndex), part => part ? filterLeafColumns(part.columns) : []);
