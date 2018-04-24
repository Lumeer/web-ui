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
import {AttributeModel} from './collection.model';
import {CollectionsAction, CollectionsActionType} from './collections.action';
import {collectionsAdapter, CollectionsState, initialCollectionsState} from './collections.state';

export function collectionsReducer(state: CollectionsState = initialCollectionsState, action: CollectionsAction.All): CollectionsState {
  switch (action.type) {
    case CollectionsActionType.GET_SUCCESS:
      return {...collectionsAdapter.addMany(action.payload.collections, state), loaded: true};
    case CollectionsActionType.GET_NAMES_SUCCESS:
      return {...state, collectionNames: action.payload.collectionNames};
    case CollectionsActionType.CREATE_SUCCESS:
      return collectionsAdapter.addOne(action.payload.collection, state);
    case CollectionsActionType.IMPORT_SUCCESS:
      return collectionsAdapter.addOne(action.payload.collection, state);
    case CollectionsActionType.UPDATE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collection.id, changes: action.payload.collection}, state);
    case CollectionsActionType.ADD_FAVORITE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favourite: true}}, state);
    case CollectionsActionType.REMOVE_FAVORITE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favourite: false}}, state);
    case CollectionsActionType.DELETE_SUCCESS:
      return collectionsAdapter.removeOne(action.payload.collectionId, state);
    case CollectionsActionType.CHANGE_ATTRIBUTE_SUCCESS:
      return onChangeAttributeSuccess(state, action);
    case CollectionsActionType.REMOVE_ATTRIBUTE_SUCCESS:
      return onRemoveAttributeSuccess(state, action);
    case CollectionsActionType.CHANGE_PERMISSION_SUCCESS:
      return onChangePermission(state, action);
    case CollectionsActionType.CHANGE_PERMISSION_FAILURE:
      return onChangePermission(state, action);
    case CollectionsActionType.CLEAR:
      return initialCollectionsState;
    default:
      return state;
  }
}

function onChangeAttributeSuccess(state: CollectionsState, action: CollectionsAction.ChangeAttributeSuccess): CollectionsState {
  let attributes = state.entities[action.payload.collectionId].attributes.slice();
  const index = attributes.findIndex(attr => attr.id === action.payload.attributeId);
  if (index >= 0) {
    attributes.splice(index, 1, action.payload.attribute);
  } else {
    attributes.push(action.payload.attribute); // TODO preserve order
  }

  if (action.payload.attributeId !== action.payload.attribute.id) {
    attributes = renameChildAttributes(attributes, action.payload.attributeId, action.payload.attribute.id);
  }

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {attributes: attributes}}, state);
}

function renameChildAttributes(attributes: AttributeModel[], oldParentId: string, newParentId: string): AttributeModel[] {
  const prefix = oldParentId + '.';
  return attributes.map(attribute => {
    if (attribute.id.startsWith(prefix)) {
      const [, suffix] = attribute.id.split(oldParentId, 2);
      return {...attribute, id: newParentId + suffix};
    }
    return attribute;
  });
}

function onRemoveAttributeSuccess(state: CollectionsState, action: CollectionsAction.RemoveAttributeSuccess): CollectionsState {
  const attributeId = action.payload.attributeId;
  const attributes = state.entities[action.payload.collectionId].attributes
    .filter(attribute => attribute.id !== attributeId && !attribute.id.startsWith(attributeId + '.'));

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {attributes: attributes}}, state);
}

function onChangePermission(state: CollectionsState, action: CollectionsAction.ChangePermissionSuccess | CollectionsAction.ChangePermissionFailure): CollectionsState {
  const collection = state.entities[action.payload.collectionId];
  const permissions = PermissionsHelper.changePermission(collection.permissions, action.payload.type, action.payload.permission);

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {permissions: permissions}}, state);
}
