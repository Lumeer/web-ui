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
import {isNullOrUndefined} from 'util';

export function collectionsReducer(
  state: CollectionsState = initialCollectionsState,
  action: CollectionsAction.All
): CollectionsState {
  switch (action.type) {
    case CollectionsActionType.GET_SUCCESS:
      return {...collectionsAdapter.addMany(action.payload.collections, state), loaded: true};
    case CollectionsActionType.GET_NAMES_SUCCESS:
      return {...state, collectionNames: action.payload.collectionNames};
    case CollectionsActionType.ADD_NAME:
      return addCollectionName(state, action.payload.name);
    case CollectionsActionType.DELETE_NAME:
      return deleteCollectionName(state, action.payload.name);
    case CollectionsActionType.CREATE_SUCCESS:
      return collectionsAdapter.addOne(action.payload.collection, state);
    case CollectionsActionType.IMPORT_SUCCESS:
      return collectionsAdapter.addOne(action.payload.collection, state);
    case CollectionsActionType.UPDATE_SUCCESS:
      return collectionsAdapter.updateOne(
        {id: action.payload.collection.id, changes: action.payload.collection},
        state
      );
    case CollectionsActionType.ADD_FAVORITE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favorite: true}}, state);
    case CollectionsActionType.REMOVE_FAVORITE_SUCCESS:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favorite: false}}, state);
    case CollectionsActionType.ADD_FAVORITE_FAILURE:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favorite: false}}, state);
    case CollectionsActionType.REMOVE_FAVORITE_FAILURE:
      return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {favorite: true}}, state);
    case CollectionsActionType.DELETE_SUCCESS:
      return collectionsAdapter.removeOne(action.payload.collectionId, state);
    case CollectionsActionType.SET_DEFAULT_ATTRIBUTE_SUCCESS:
      return setDefaultAttribute(state, action.payload.collectionId, action.payload.attributeId);
    case CollectionsActionType.SET_DEFAULT_ATTRIBUTE_FAILURE:
      return setDefaultAttribute(state, action.payload.collectionId, action.payload.oldDefaultAttributeId);
    case CollectionsActionType.CREATE_ATTRIBUTES_SUCCESS:
      return onCreateAttributesSuccess(state, action.payload.collectionId, action.payload.attributes);
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

function addCollectionName(state: CollectionsState, name: string): CollectionsState {
  const names = state.collectionNames || [];
  return {...state, collectionNames: [...names, name]};
}

function deleteCollectionName(state: CollectionsState, name: string): CollectionsState {
  const names = state.collectionNames || [];
  const index = names.findIndex(n => n === name);
  if (index >= 0) {
    names.splice(index, 1);
  }
  return {...state, collectionNames: names};
}

function updateCollectionNames(state: CollectionsState, addName?: string, removeName?: string): CollectionsState {
  if (!addName && !removeName) {
    return state;
  }

  const collectionNames = state.collectionNames || [];
  const indexToRemove = collectionNames.findIndex(name => name === removeName);
  if (indexToRemove >= 0) {
    collectionNames.splice(indexToRemove, 1);
  }

  if (addName) {
    collectionNames.push(addName);
  }

  return {...state, collectionNames};
}

function setDefaultAttribute(state: CollectionsState, collectionId: string, attributeId: string): CollectionsState {
  return collectionsAdapter.updateOne({id: collectionId, changes: {defaultAttributeId: attributeId}}, state);
}

function onCreateAttributesSuccess(
  state: CollectionsState,
  collectionId: string,
  attributes: AttributeModel[]
): CollectionsState {
  const newAttributes = state.entities[collectionId].attributes.concat(attributes);
  return collectionsAdapter.updateOne({id: collectionId, changes: {attributes: newAttributes}}, state);
}

function onChangeAttributeSuccess(
  state: CollectionsState,
  action: CollectionsAction.ChangeAttributeSuccess
): CollectionsState {
  let attributes = state.entities[action.payload.collectionId].attributes.slice();
  const index = attributes.findIndex(attr => attr.id === action.payload.attributeId);
  const oldAttributeCopy = index >= 0 ? {...attributes[index]} : null;
  if (index >= 0) {
    attributes.splice(index, 1, action.payload.attribute);
  } else {
    attributes.push(action.payload.attribute); // TODO preserve order
  }

  if (!isNullOrUndefined(oldAttributeCopy) && oldAttributeCopy.name !== action.payload.attribute.name) {
    attributes = renameChildAttributes(attributes, oldAttributeCopy.name, action.payload.attribute.name);
  }

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {attributes: attributes}}, state);
}

function renameChildAttributes(
  attributes: AttributeModel[],
  oldParentName: string,
  newParentName: string
): AttributeModel[] {
  const prefix = oldParentName + '.';
  return attributes.map(attribute => {
    if (attribute.name.startsWith(prefix)) {
      const [, suffix] = attribute.name.split(oldParentName, 2);
      return {...attribute, name: newParentName + suffix};
    }
    return attribute;
  });
}

function onRemoveAttributeSuccess(
  state: CollectionsState,
  action: CollectionsAction.RemoveAttributeSuccess
): CollectionsState {
  const attributeId = action.payload.attributeId;
  const attributes = state.entities[action.payload.collectionId].attributes.filter(
    attribute => attribute.id !== attributeId && !attribute.id.startsWith(attributeId + '.')
  );

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {attributes: attributes}}, state);
}

function onChangePermission(
  state: CollectionsState,
  action: CollectionsAction.ChangePermissionSuccess | CollectionsAction.ChangePermissionFailure
): CollectionsState {
  const collection = state.entities[action.payload.collectionId];
  const permissions = PermissionsHelper.changePermission(
    collection.permissions,
    action.payload.type,
    action.payload.permission
  );

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {permissions: permissions}}, state);
}
