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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {TableCursor} from './table-cursor';
import {DEFAULT_TABLE_ID, TableModel} from './table.model';
import {selectWorkspace} from '../navigation/navigation.state';

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

export const selectTablesDictionary = createSelector(
  selectTablesState,
  tablesAdapter.getSelectors().selectEntities
);

export const selectTableId = createSelector(
  selectWorkspace,
  workspace => (workspace && workspace.viewCode) || DEFAULT_TABLE_ID
);

export const selectTable = createSelector(
  selectTablesDictionary,
  selectTableId,
  (tablesMap, tableId) => tableId && tablesMap[tableId]
);
