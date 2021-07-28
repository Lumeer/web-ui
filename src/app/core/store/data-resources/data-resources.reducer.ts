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

import {DataResourcesState, initialDataResourcesState} from './data-resources.state';
import {DataResourcesAction, DataResourcesActionType} from './data-resources.action';
import {addDataQueryUnique, removeDataQuery} from '../navigation/query/query.helper';

export function dataResourcesReducer(
  state: DataResourcesState = initialDataResourcesState,
  action: DataResourcesAction.All
): DataResourcesState {
  switch (action.type) {
    case DataResourcesActionType.GET_SUCCESS:
      return {
        ...state,
        queries: addDataQueryUnique(state.queries, action.payload.query),
        loadingQueries: removeDataQuery(state.loadingQueries, action.payload.query),
      };
    case DataResourcesActionType.GET_FAILURE:
      return {...state, loadingQueries: removeDataQuery(state.loadingQueries, action.payload.query)};
    case DataResourcesActionType.SET_LOADING_QUERY:
      return {...state, loadingQueries: addDataQueryUnique(state.loadingQueries, action.payload.query)};
    case DataResourcesActionType.GET_TASKS_SUCCESS:
      return {
        ...state,
        tasksQueries: addDataQueryUnique(state.tasksQueries, action.payload.query),
        loadingTasksQueries: removeDataQuery(state.loadingTasksQueries, action.payload.query),
      };
    case DataResourcesActionType.GET_TASKS_FAILURE:
      return {...state, loadingTasksQueries: removeDataQuery(state.loadingTasksQueries, action.payload.query)};
    case DataResourcesActionType.SET_LOADING_TASKS_QUERY:
      return {...state, loadingTasksQueries: addDataQueryUnique(state.loadingTasksQueries, action.payload.query)};
    case DataResourcesActionType.CLEAR_QUERIES:
      if (action.payload.collectionId) {
        return {
          ...state,
          queries: state.queries.filter(
            query => !query.stems?.some(stem => stem.collectionId === action.payload.collectionId)
          ),
          tasksQueries: state.tasksQueries.filter(
            query => !query.stems?.some(stem => stem.collectionId === action.payload.collectionId)
          ),
        };
      }
      return {...state, queries: [], tasksQueries: []};
    case DataResourcesActionType.CLEAR:
      return initialDataResourcesState;
    default:
      return state;
  }
}
