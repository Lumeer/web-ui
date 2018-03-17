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
import {TableModel} from './table.model';

export const TABLE_FEATURE_NAME = 'tables';

export interface TablesState extends EntityState<TableModel> {
}

export const tablesAdapter = createEntityAdapter<TableModel>({selectId: table => table.id});

export function initialTablesState(): TablesState {
  return tablesAdapter.getInitialState();
}

export const selectTablesState = createFeatureSelector<TablesState>(TABLE_FEATURE_NAME);

export const selectTablesDictionary = createSelector(selectTablesState, tablesAdapter.getSelectors().selectEntities);
export const selectTableById = (tableId) => createSelector(selectTablesDictionary, tablesDictionary => tablesDictionary[tableId]);
export const selectTableSelectedCell = (tableId) => createSelector(selectTableById(tableId), table => table ? table.selectedCell : null);
