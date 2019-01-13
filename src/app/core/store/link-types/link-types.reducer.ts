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
import {LinkType} from './link.type';

export function linkTypesReducer(
  state: LinkTypesState = initialLinkTypesState,
  action: LinkTypesAction.All
): LinkTypesState {
  switch (action.type) {
    case LinkTypesActionType.GET_SUCCESS:
      return addLinkTypes(state, action.payload.linkTypes);
    case LinkTypesActionType.CREATE_SUCCESS:
      return addOrUpdateLinkType(state, action.payload.linkType);
    case LinkTypesActionType.UPDATE_SUCCESS:
      return addOrUpdateLinkType(state, action.payload.linkType);
    case LinkTypesActionType.DELETE_SUCCESS:
      return linkTypesAdapter.removeOne(action.payload.linkTypeId, state);
    case LinkTypesActionType.CLEAR:
      return initialLinkTypesState;
    default:
      return state;
  }
}

function addLinkTypes(state: LinkTypesState, linkTypes: LinkType[]): LinkTypesState {
  const newState = {...state, loaded: true};
  const filteredLinkTypes = linkTypes.filter(linkType => {
    const oldLinkType = state.entities[linkType.id];
    return !oldLinkType || isLinkTypeNewer(linkType, oldLinkType);
  });

  return linkTypesAdapter.addMany(filteredLinkTypes, newState);
}

function isLinkTypeNewer(linkType: LinkType, oldLinkType: LinkType): boolean {
  return linkType.version && (!oldLinkType.version || linkType.version > oldLinkType.version);
}

function addOrUpdateLinkType(state: LinkTypesState, linkType: LinkType): LinkTypesState {
  const oldLinkType = state.entities[linkType.id];
  if (!oldLinkType) {
    return linkTypesAdapter.addOne(linkType, state);
  }

  if (isLinkTypeNewer(linkType, oldLinkType)) {
    return linkTypesAdapter.upsertOne(linkType, state);
  }
  return state;
}
