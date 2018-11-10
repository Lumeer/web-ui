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

import {LinkTypesAction, LinkTypesActionType} from './link-types.action';
import {initialLinkTypesState, linkTypesAdapter, LinkTypesState} from './link-types.state';

export function linkTypesReducer(
  state: LinkTypesState = initialLinkTypesState,
  action: LinkTypesAction.All
): LinkTypesState {
  switch (action.type) {
    case LinkTypesActionType.GET_SUCCESS:
      return linkTypesAdapter.addMany(action.payload.linkTypes, {...state, loaded: true});
    case LinkTypesActionType.CREATE_SUCCESS:
      return linkTypesAdapter.addOne(action.payload.linkType, state);
    case LinkTypesActionType.UPDATE_SUCCESS:
      return linkTypesAdapter.updateOne({id: action.payload.linkType.id, changes: action.payload.linkType}, state);
    case LinkTypesActionType.DELETE_SUCCESS:
      return linkTypesAdapter.removeOne(action.payload.linkTypeId, state);
    case LinkTypesActionType.CLEAR:
      return initialLinkTypesState;
    default:
      return state;
  }
}
