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

import {LinkInstancesAction, LinkInstancesActionType} from './link-instances.action';
import {initialLinkInstancesState, linkInstancesAdapter, LinkInstancesState} from './link-instances.state';

export function linkInstancesReducer(
  state: LinkInstancesState = initialLinkInstancesState,
  action: LinkInstancesAction.All
): LinkInstancesState {
  switch (action.type) {
    case LinkInstancesActionType.GET_SUCCESS:
      const queriesState = {...state, queries: state.queries.concat(action.payload.query)};
      return linkInstancesAdapter.addMany(action.payload.linkInstances, queriesState);
    case LinkInstancesActionType.CREATE_SUCCESS:
      return linkInstancesAdapter.addOne(action.payload.linkInstance, state);
    case LinkInstancesActionType.UPDATE_SUCCESS:
      return linkInstancesAdapter.updateOne(
        {id: action.payload.linkInstance.id, changes: action.payload.linkInstance},
        state
      );
    case LinkInstancesActionType.DELETE_SUCCESS:
      return linkInstancesAdapter.removeOne(action.payload.linkInstanceId, state);
    case LinkInstancesActionType.CLEAR:
      return initialLinkInstancesState;
    default:
      return state;
  }
}
