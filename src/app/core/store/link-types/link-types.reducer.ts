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
    case LinkTypesActionType.CREATE_ATTRIBUTES_SUCCESS:
      return onCreateAttributesSuccess(action, state);
    case LinkTypesActionType.UPDATE_ATTRIBUTE_SUCCESS:
      return onUpdateAttributeSuccess(action, state);
    case LinkTypesActionType.DELETE_ATTRIBUTE_SUCCESS:
      return onDeleteAttributeSuccess(action, state);
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

function onCreateAttributesSuccess(
  action: LinkTypesAction.CreateAttributesSuccess,
  state: LinkTypesState
): LinkTypesState {
  const linkType = state.entities[action.payload.linkTypeId];
  if (!linkType) {
    return state;
  }

  const attributesToAdd = action.payload.attributes.filter(attr => !linkType.attributes.find(a => a.id === attr.id));
  const attributes = linkType.attributes.concat(attributesToAdd);
  return linkTypesAdapter.updateOne({id: action.payload.linkTypeId, changes: {attributes}}, state);
}

function onUpdateAttributeSuccess(
  action: LinkTypesAction.UpdateAttributeSuccess,
  state: LinkTypesState
): LinkTypesState {
  const linkType = state.entities[action.payload.linkTypeId];
  if (!linkType) {
    return state;
  }

  const attributes = updateAttributes(linkType.attributes, action.payload.attribute);
  return linkTypesAdapter.updateOne({id: action.payload.linkTypeId, changes: {attributes}}, state);
}

function onDeleteAttributeSuccess(
  action: LinkTypesAction.DeleteAttributeSuccess,
  state: LinkTypesState
): LinkTypesState {
  const {linkTypeId, attribute} = action.payload;
  const linkType = state.entities[linkTypeId];
  if (!linkType) {
    return state;
  }

  const attributes = filterOutAttributeAndChildren(linkType.attributes, attribute);
  return linkTypesAdapter.updateOne({id: linkTypeId, changes: {attributes}}, state);
}
