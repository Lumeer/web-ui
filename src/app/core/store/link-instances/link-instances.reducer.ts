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
    case LinkInstancesActionType.CREATE_MULTIPLE_SUCCESS:
      return linkInstancesAdapter.upsertMany(action.payload.linkInstances, state);
    case LinkInstancesActionType.PATCH_DATA_INTERNAL:
      return patchData(state, action);
    case LinkInstancesActionType.UPDATE_INTERNAL:
      return updateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.UPDATE_DATA_INTERNAL:
      return updateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.UPDATE_SUCCESS:
      return addOrUpdateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.UPDATE_FAILURE:
      return revertLinkInstance(state, action.payload.originalLinkInstance);
    case LinkInstancesActionType.UPDATE_DATA_VALUES:
      return updateDataValues(state, action);
    case LinkInstancesActionType.DELETE_SUCCESS:
      return linkInstancesAdapter.removeOne(action.payload.linkInstanceId, state);
    case LinkInstancesActionType.DELETE_FAILURE:
      return addOrUpdateLinkInstance(state, action.payload.linkInstance);
    case LinkInstancesActionType.DUPLICATE_SUCCESS:
      return linkInstancesAdapter.upsertMany(action.payload.linkInstances, state);
    case LinkInstancesActionType.RUN_RULE:
      return setActionExecutionTime(
        state,
        action.payload.linkInstanceId,
        action.payload.attributeId,
        new Date().getTime()
      );
    case LinkInstancesActionType.RUN_RULE_FAILURE:
      return setActionExecutionTime(state, action.payload.linkInstanceId, action.payload.attributeId);
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

function setActionExecutionTime(
  state: LinkInstancesState,
  linkInstanceId: string,
  attributeId: string,
  time?: number
): LinkInstancesState {
  const performedActions = {...state.actionExecutedTimes};
  if (time) {
    performedActions[linkInstanceId] = {...(state.actionExecutedTimes[linkInstanceId] || {}), [attributeId]: time};
  } else {
    const linkExecutedTimes = {...performedActions?.[linkInstanceId]};
    delete linkExecutedTimes?.[attributeId];
    performedActions[linkInstanceId] = linkExecutedTimes;
  }
  return {...state, actionExecutedTimes: performedActions};
}

function updateLinkInstance(state: LinkInstancesState, linkInstance: LinkInstance): LinkInstancesState {
  return linkInstancesAdapter.upsertOne(
    {
      ...linkInstance,
      dataVersion: (linkInstance.dataVersion || 0) + 1,
    },
    state
  );
}

function addLinkInstances(state: LinkInstancesState, action: LinkInstancesAction.GetSuccess): LinkInstancesState {
  const newState = action.payload.query ? {...state, queries: state.queries.concat(action.payload.query)} : state;
  const filteredLinkInstances = action.payload.linkInstances.filter(linkInstance => {
    const oldLinkInstance = state.entities[linkInstance.id];
    return !oldLinkInstance || isLinkInstanceNewer(linkInstance, oldLinkInstance);
  });
  const filteredLinkInstanceIds = filteredLinkInstances.map(doc => doc.id);

  const changedTransientProperties = action.payload.linkInstances.reduce<LinkInstance[]>((result, linkInstance) => {
    const oldLinkInstances = state.entities[linkInstance.id];

    if (!filteredLinkInstanceIds.includes(linkInstance.id) && isTransientModified(linkInstance, oldLinkInstances)) {
      result.push({...oldLinkInstances, commentsCount: linkInstance.commentsCount});
    }

    return result;
  }, []);

  return linkInstancesAdapter.upsertMany([...filteredLinkInstances, ...changedTransientProperties], newState);
}

function isTransientModified(linkInstance: LinkInstance, oldLinkInstance: LinkInstance): boolean {
  return (
    (linkInstance.commentsCount || linkInstance.commentsCount === 0) &&
    oldLinkInstance.commentsCount !== linkInstance.commentsCount
  );
}

function isLinkInstanceNewer(linkInstance: LinkInstance, oldLinkInstance: LinkInstance): boolean {
  return (
    linkInstance.dataVersion && (!oldLinkInstance.dataVersion || linkInstance.dataVersion > oldLinkInstance.dataVersion)
  );
}

function addOrUpdateLinkInstance(state: LinkInstancesState, linkInstance: LinkInstance): LinkInstancesState {
  const newLinkInstance = {...linkInstance};
  const oldLinkInstance = state.entities[newLinkInstance.id];
  if (!oldLinkInstance) {
    return linkInstancesAdapter.addOne(newLinkInstance, state);
  }

  if (isLinkInstanceNewer(newLinkInstance, oldLinkInstance)) {
    if (!newLinkInstance.commentsCount && !!oldLinkInstance.commentsCount) {
      newLinkInstance.commentsCount = oldLinkInstance.commentsCount;
    }
    return linkInstancesAdapter.upsertOne(newLinkInstance, state);
  } else if (isModifiedLater(newLinkInstance, oldLinkInstance)) {
    return linkInstancesAdapter.updateOne(
      {
        id: newLinkInstance.id,
        changes: {
          updateDate: newLinkInstance.updateDate,
          updatedBy: newLinkInstance.updatedBy,
          commentsCount: newLinkInstance.commentsCount || oldLinkInstance.commentsCount,
        },
      },
      state
    );
  } else if (isTransientModified(newLinkInstance, oldLinkInstance)) {
    return linkInstancesAdapter.updateOne(
      {id: newLinkInstance.id, changes: {commentsCount: newLinkInstance.commentsCount}},
      state
    );
  }

  return state;
}

function patchData(state: LinkInstancesState, action: LinkInstancesAction.PatchDataInternal) {
  const {linkInstance, originalLinkInstance} = action.payload;

  return linkInstancesAdapter.updateOne(
    {
      id: linkInstance.id,
      changes: {
        data: {
          ...originalLinkInstance.data,
          ...linkInstance.data,
        },
        dataValues: {
          ...originalLinkInstance.dataValues,
          ...linkInstance.dataValues,
        },
        dataVersion: (linkInstance.dataVersion || 0) + 1,
      },
    },
    state
  );
}

function revertLinkInstance(state: LinkInstancesState, originalLinkInstance: LinkInstance): LinkInstancesState {
  return linkInstancesAdapter.upsertOne(originalLinkInstance, state);
}

function isModifiedLater(linkInstance: LinkInstance, oldLinkInstance: LinkInstance): boolean {
  return (
    linkInstance.updateDate &&
    (!oldLinkInstance.updateDate || linkInstance.updateDate.getTime() > oldLinkInstance.updateDate.getTime())
  );
}

function updateDataValues(state: LinkInstancesState, action: LinkInstancesAction.UpdateDataValues) {
  const updateDocuments = action.payload.linkInstances.reduce((linkInstances, linkInstance) => {
    const oldDocument = state.entities[linkInstance.id];
    if (oldDocument) {
      linkInstances.push({...oldDocument, dataValues: linkInstance.dataValues});
    }

    return linkInstances;
  }, []);

  return linkInstancesAdapter.upsertMany(updateDocuments, state);
}
