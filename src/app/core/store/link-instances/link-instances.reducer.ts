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

import {LinkInstancesAction, LinkInstancesActionType} from './link-instances.action';
import {initialLinkInstancesState, linkInstancesAdapter, LinkInstancesState} from './link-instances.state';
import {LinkInstance} from './link.instance';

export function linkInstancesReducer(
  state: LinkInstancesState = initialLinkInstancesState,
  action: LinkInstancesAction.All
): LinkInstancesState {
  switch (action.type) {
    case LinkInstancesActionType.GET_SUCCESS:
      return addLinkInstances(state, action);
    case LinkInstancesActionType.CREATE_SUCCESS:
      return addOrUpdateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.PATCH_DATA_INTERNAL:
      return patchData(state, action);
    case LinkInstancesActionType.UPDATE_SUCCESS:
      return addOrUpdateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.UPDATE_FAILURE:
      return revertLinkInstance(state, action.payload.originalLinkInstance);
    case LinkInstancesActionType.DELETE_SUCCESS:
      return linkInstancesAdapter.removeOne(action.payload.linkInstanceId, state);
    case LinkInstancesActionType.DUPLICATE_SUCCESS:
      return linkInstancesAdapter.addMany(action.payload.linkInstances, state);
    case LinkInstancesActionType.CLEAR_BY_LINK_TYPE:
      return linkInstancesAdapter.removeMany(
        linkInstance => linkInstance.linkTypeId === action.payload.linkTypeId,
        state
      );
    case LinkInstancesActionType.CLEAR:
      return initialLinkInstancesState;
    default:
      return state;
  }
}

function addLinkInstances(state: LinkInstancesState, action: LinkInstancesAction.GetSuccess): LinkInstancesState {
  const newState = action.payload.query ? {...state, queries: state.queries.concat(action.payload.query)} : state;
  const filteredLinkInstances = action.payload.linkInstances.filter(linkInstance => {
    const oldLinkInstance = state.entities[linkInstance.id];
    return !oldLinkInstance || isLinkInstanceNewer(linkInstance, oldLinkInstance);
  });

  return linkInstancesAdapter.addMany(filteredLinkInstances, newState);
}

function isLinkInstanceNewer(linkInstance: LinkInstance, oldLinkInstance: LinkInstance): boolean {
  return (
    linkInstance.dataVersion && (!oldLinkInstance.dataVersion || linkInstance.dataVersion > oldLinkInstance.dataVersion)
  );
}

function addOrUpdateLinkInstance(state: LinkInstancesState, linkInstance: LinkInstance): LinkInstancesState {
  const oldLinkInstance = state.entities[linkInstance.id];
  if (!oldLinkInstance) {
    return linkInstancesAdapter.addOne(linkInstance, state);
  }

  if (isLinkInstanceNewer(linkInstance, oldLinkInstance)) {
    return linkInstancesAdapter.upsertOne(linkInstance, state);
  }
  return state;
}

function patchData(state: LinkInstancesState, action: LinkInstancesAction.PatchDataInternal) {
  const {linkInstanceId, data} = action.payload;

  const linkInstance = state.entities[linkInstanceId];
  if (!linkInstance) {
    return state;
  }

  return linkInstancesAdapter.updateOne({id: linkInstanceId, changes: {data: {...linkInstance.data, ...data}}}, state);
}

function revertLinkInstance(state: LinkInstancesState, originalLinkInstance: LinkInstance): LinkInstancesState {
  const storedLinkInstance = state.entities[originalLinkInstance && originalLinkInstance.id];

  if (
    storedLinkInstance &&
    originalLinkInstance &&
    storedLinkInstance.dataVersion &&
    originalLinkInstance.dataVersion &&
    storedLinkInstance.dataVersion <= originalLinkInstance.dataVersion
  ) {
    return linkInstancesAdapter.upsertOne(originalLinkInstance, state);
  }

  return state;
}
