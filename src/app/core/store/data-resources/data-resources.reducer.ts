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
import {areQueriesEqual} from '../navigation/query/query.helper';

export function dataResourcesReducer(
  state: DataResourcesState = initialDataResourcesState,
  action: DataResourcesAction.All
): DataResourcesState {
  switch (action.type) {
    case DataResourcesActionType.GET_SUCCESS:
      const shouldAddQuery =
        action.payload.query && !state.queries.some(query => areQueriesEqual(query, action.payload.query));
      if (shouldAddQuery) {
        return {...state, queries: [...state.queries, action.payload.query]};
      }
      return state;
    case DataResourcesActionType.CLEAR:
      return initialDataResourcesState;
    default:
      return state;
  }
}