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

import {filterOutAttributeAndChildren, updateAttributes} from '../../../shared/utils/attribute.utils';
import {PermissionsHelper} from '../permissions/permissions.helper';
import {Attribute, Collection} from './collection';
import {CollectionsAction, CollectionsActionType} from './collections.action';
import {collectionsAdapter, CollectionsState, initialCollectionsState} from './collections.state';

export function collectionsReducer(
  state: CollectionsState = initialCollectionsState,
  action: CollectionsAction.All
): CollectionsState {
  switch (action.type) {
    case CollectionsActionType.GET_SUCCESS:
      return addCollections(state, action.payload.collections);
    case CollectionsActionType.CREATE_SUCCESS:
    case CollectionsActionType.IMPORT_SUCCESS:
    case CollectionsActionType.UPDATE_SUCCESS:
    case CollectionsActionType.UPDATE_PURPOSE_SUCCESS:
      return addOrUpdateCollection(state, action.payload.collection);
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
    case CollectionsActionType.RENAME_ATTRIBUTE_SUCCESS:
      return renameAttribute(state, action.payload.collectionId, action.payload.attributeId, action.payload.name);
    case CollectionsActionType.RENAME_ATTRIBUTE_FAILURE:
      return renameAttribute(state, action.payload.collectionId, action.payload.attributeId, action.payload.oldName);
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

function addCollections(state: CollectionsState, collections: Collection[]): CollectionsState {
  const newState = {...state, loaded: true};
  const filteredCollections = (collections || []).filter(collection => {
    const oldCollection = state.entities[collection.id];
    return !oldCollection || isCollectionNewer(collection, oldCollection);
  });

  return collectionsAdapter.upsertMany(filteredCollections, newState);
}

function addOrUpdateCollection(state: CollectionsState, collection: Collection): CollectionsState {
  const oldCollection = state.entities[collection.id];
  if (!oldCollection) {
    return collectionsAdapter.addOne(collection, state);
  }

  if (isCollectionNewer(collection, oldCollection)) {
    return collectionsAdapter.upsertOne(collection, state);
  }
  return state;
}

function renameAttribute(
  state: CollectionsState,
  collectionId: string,
  attributeId: string,
  name: string
): CollectionsState {
  const collection = state.entities[collectionId];
  if (collection) {
    const attributes = [...collection.attributes];
    const attributeIndex = attributes.findIndex(attribute => attribute.id === attributeId);
    if (attributeIndex !== -1) {
      attributes.splice(attributeIndex, 1, {...attributes[attributeIndex], name});
      return collectionsAdapter.updateOne({id: collectionId, changes: {attributes}}, state);
    }
  }

  return state;
}

function isCollectionNewer(collection: Collection, oldCollection: Collection): boolean {
  return collection.version && (!oldCollection.version || collection.version > oldCollection.version);
}

function setDefaultAttribute(state: CollectionsState, collectionId: string, attributeId: string): CollectionsState {
  return collectionsAdapter.updateOne({id: collectionId, changes: {defaultAttributeId: attributeId}}, state);
}

function onCreateAttributesSuccess(
  state: CollectionsState,
  collectionId: string,
  attributes: Attribute[]
): CollectionsState {
  const collection = state.entities[collectionId];
  if (!collection) {
    return state;
  }
  const attributesToAdd = attributes.filter(attr => !collection.attributes.find(a => a.id === attr.id));
  const newAttributes = state.entities[collectionId].attributes.concat(attributesToAdd);
  return collectionsAdapter.updateOne({id: collectionId, changes: {attributes: newAttributes}}, state);
}

function onChangeAttributeSuccess(
  state: CollectionsState,
  action: CollectionsAction.ChangeAttributeSuccess
): CollectionsState {
  const collection = state.entities[action.payload.collectionId];
  if (!collection) {
    return state;
  }

  const attributes = updateAttributes(collection.attributes, action.payload.attribute);
  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {attributes}}, state);
}

function onRemoveAttributeSuccess(
  state: CollectionsState,
  action: CollectionsAction.RemoveAttributeSuccess
): CollectionsState {
  const {collectionId, attribute} = action.payload;

  const collection = state.entities[action.payload.collectionId];
  if (!collection) {
    return state;
  }

  const attributes = filterOutAttributeAndChildren(collection.attributes, attribute);
  return collectionsAdapter.updateOne({id: collectionId, changes: {attributes}}, state);
}

function onChangePermission(
  state: CollectionsState,
  action: CollectionsAction.ChangePermissionSuccess | CollectionsAction.ChangePermissionFailure
): CollectionsState {
  const collection = state.entities[action.payload.collectionId];
  const permissions = PermissionsHelper.changePermission(
    collection.permissions,
    action.payload.type,
    action.payload.permissions
  );

  return collectionsAdapter.updateOne({id: action.payload.collectionId, changes: {permissions: permissions}}, state);
}
