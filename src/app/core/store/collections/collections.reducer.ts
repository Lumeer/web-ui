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

import {PermissionsHelper} from '../permissions/permissions.helper';
import {CollectionsAction, CollectionsActionType} from './collections.action';
import {collectionsAdapter, CollectionsState, initialCollectionsState} from './collections.state';

export function collectionsReducer(state: CollectionsState = initialCollectionsState, action: CollectionsAction.All): CollectionsState {
  switch (action.type) {
    case CollectionsActionType.GET_SUCCESS:
      return collectionsAdapter.addMany(action.payload.collections, state);
    case CollectionsActionType.CREATE_SUCCESS:
      return collectionsAdapter.addOne(action.payload.collection, state);
    case CollectionsActionType.UPDATE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collection.code, changes: action.payload.collection}, state);
    case CollectionsActionType.DELETE_SUCCESS:
      return collectionsAdapter.removeOne(action.payload.collectionCode, state);
    case CollectionsActionType.CHANGE_ATTRIBUTE_SUCCESS:
      return onChangeAttributeSuccess(state, action);
    case CollectionsActionType.REMOVE_ATTRIBUTE_SUCCESS:
      return onRemoveAttributeSuccess(state, action);
    case CollectionsActionType.CHANGE_PERMISSION_SUCCESS:
      return onChangePermissionSuccess(state, action);
    case CollectionsActionType.REMOVE_PERMISSION_SUCCESS:
      return onRemovePermissionSuccess(state, action);
    default:
      return state;
  }
}

function onChangeAttributeSuccess(state: CollectionsState, action: CollectionsAction.ChangeAttributeSuccess): CollectionsState {
  const attributes = state.entities[action.payload.collectionCode].attributes.slice();
  const index = attributes.findIndex(attr => attr.id === action.payload.attributeId);
  if (index) {
    attributes.splice(index, 1, action.payload.attribute);
  } else {
    attributes.push(action.payload.attribute); // TODO preserve order
  }

  return collectionsAdapter.updateOne({id: action.payload.collectionCode, changes: {attributes: attributes}}, state);
}

function onRemoveAttributeSuccess(state: CollectionsState, action: CollectionsAction.RemoveAttributeSuccess): CollectionsState {
  const attributes = state.entities[action.payload.collectionCode].attributes.slice();
  const index = attributes.findIndex(attr => attr.id === action.payload.attributeId);
  if (index) {
    attributes.splice(index, 1);
  }

  return collectionsAdapter.updateOne({id: action.payload.collectionCode, changes: {attributes: attributes}}, state);
}

function onChangePermissionSuccess(state: CollectionsState, action: CollectionsAction.ChangePermissionSuccess): CollectionsState {
  const collection = state.entities[action.payload.collectionCode];
  const permissions = PermissionsHelper.changePermission(collection.permissions, action.payload.type, action.payload.permission);

  return collectionsAdapter.updateOne({id: action.payload.collectionCode, changes: {permissions: permissions}}, state);
}

function onRemovePermissionSuccess(state: CollectionsState, action: CollectionsAction.RemovePermissionSuccess): CollectionsState {
  const collection = state.entities[action.payload.collectionCode];
  const permissions = PermissionsHelper.removePermission(collection.permissions, action.payload.type, action.payload.name);

  return collectionsAdapter.updateOne({id: action.payload.collectionCode, changes: {permissions: permissions}}, state);
}
