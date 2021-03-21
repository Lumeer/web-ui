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
import {DataQuery} from '../../model/data-query';
import {selectViewDataQuery} from '../view-settings/view-settings.state';
import {isDataQueryLoaded} from '../utils/data-query-payload';
import {configuration} from '../../../../environments/configuration';

export interface DataResourcesState {
  queries: DataQuery[];
  tasksQueries: DataQuery[];
  loadingQueries: DataQuery[];
  loadingTasksQueries: DataQuery[];
}

export const initialDataResourcesState: DataResourcesState = {
  queries: [],
  tasksQueries: [],
  loadingQueries: [],
  loadingTasksQueries: [],
};

export const selectDataResourcesState = (state: AppState) => state.dataResources;

export const selectDataResourcesQueries = createSelector(selectDataResourcesState, state => state.queries);

export const selectDataResourcesLoadingQueries = createSelector(
  selectDataResourcesState,
  state => state.loadingQueries
);

export const selectTasksQueries = createSelector(selectDataResourcesState, state => state.tasksQueries);

export const selectTasksLoadingQueries = createSelector(selectDataResourcesState, state => state.loadingTasksQueries);

export const selectCurrentQueryDataResourcesLoaded = createSelector(
  selectDataResourcesQueries,
  selectViewDataQuery,
  (queries, currentQuery) => isDataQueryLoaded(currentQuery, queries, configuration.publicView)
);

export const selectCurrentQueryTasksLoaded = createSelector(
  selectTasksQueries,
  selectViewDataQuery,
  (queries, currentQuery) => isDataQueryLoaded(currentQuery, queries, configuration.publicView)
);

export const selectQueryDataResourcesLoaded = (query: DataQuery) =>
  createSelector(selectDataResourcesQueries, queries => isDataQueryLoaded(query, queries, configuration.publicView));
