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
import {Query} from '../navigation/query/query';
import {selectQuery} from '../navigation/navigation.state';
import {areQueriesEqualExceptFiltersAndPagination} from '../navigation/query/query.helper';

export interface DataResourcesState {
  queries: Query[];
}

export const initialDataResourcesState: DataResourcesState = {
  queries: [],
};

export const selectDataResourcesState = (state: AppState) => state.dataResources;

export const selectDataResourcesQueries = createSelector(selectDataResourcesState, state => state.queries);

export const selectCurrentQueryDataResourcesLoaded = createSelector(
  selectDataResourcesQueries,
  selectQuery,
  (queries, currentQuery) => !!queries.find(query => areQueriesEqualExceptFiltersAndPagination(query, currentQuery))
);

export const selectQueryDataResourcesLoaded = (query: Query) =>
  createSelector(
    selectDataResourcesQueries,
    queries => !!queries.find(q => areQueriesEqualExceptFiltersAndPagination(q, query))
  );
