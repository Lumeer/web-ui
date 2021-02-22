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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {selectQuery} from '../navigation/navigation.state';
import {isDataQueryLoaded} from '../navigation/query/query.helper';
import {selectTasksQuery} from '../common/permissions.selectors';
import {DataQuery} from '../../model/data-query';

export interface DataResourcesState {
  queries: DataQuery[];
  tasksQueries: DataQuery[];
}

export const initialDataResourcesState: DataResourcesState = {
  queries: [],
  tasksQueries: [],
};

export const selectDataResourcesState = (state: AppState) => state.dataResources;

export const selectDataResourcesQueries = createSelector(selectDataResourcesState, state => state.queries);

export const selectTasksQueries = createSelector(selectDataResourcesState, state => state.tasksQueries);

export const selectCurrentQueryDataResourcesLoaded = createSelector(
  selectDataResourcesQueries,
  selectQuery,
  (queries, currentQuery) => isDataQueryLoaded(currentQuery, queries)
);

export const selectCurrentQueryTasksLoaded = createSelector(
  selectTasksQueries,
  selectTasksQuery,
  (queries, currentQuery) => isDataQueryLoaded(currentQuery, queries)
);

export const selectQueryDataResourcesLoaded = (query: DataQuery) =>
  createSelector(selectDataResourcesQueries, queries => isDataQueryLoaded(query, queries));
