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

import {initialViewSettingsState, ViewSettingsState} from './view-settings.state';
import {ViewSettingsAction, ViewSettingsActionType} from './view-settings.action';
import {ResourceAttributeSettings, ViewSettings} from '../views/view';
import {
  addAttributeToSettings,
  createAttributesSettingsOrder,
  moveAttributeInSettings,
} from '../../../shared/settings/settings.util';
import {AttributesResource} from '../../model/resource';

export function viewSettingsReducer(
  state: ViewSettingsState = initialViewSettingsState,
  action: ViewSettingsAction.All
): ViewSettingsState {
  switch (action.type) {
    case ViewSettingsActionType.HIDE_ATTRIBUTES:
      return hideOrShowAttributes(state, action, true);
    case ViewSettingsActionType.SHOW_ATTRIBUTES:
      return hideOrShowAttributes(state, action, false);
    case ViewSettingsActionType.MOVE_ATTRIBUTE:
      return moveAttribute(state, action);
    case ViewSettingsActionType.ADD_ATTRIBUTE:
      return addAttribute(state, action);
    case ViewSettingsActionType.SET_SETTINGS:
      return {...action.payload.settings};
    case ViewSettingsActionType.RESET_SETTINGS:
      return {};
    default:
      return state;
  }
}

function hideOrShowAttributes(
  state: ViewSettingsState,
  action: ViewSettingsAction.HideAttributes | ViewSettingsAction.ShowAttributes,
  hide: boolean
): ViewSettingsState {
  const {attributeIds, collection, linkType} = action.payload;
  const property = linkType ? 'linkTypes' : 'collections';
  const settings = hideOrShowAttributesInResource(state, linkType || collection, attributeIds, property, hide);
  return {...settings};
}

function hideOrShowAttributesInResource(
  settings: ViewSettings,
  resource: AttributesResource,
  attributeIds: string[],
  property: string,
  hide: boolean
): ViewSettings {
  const attributesSettings = {...settings?.attributes};
  const resourceSettings = {...attributesSettings?.[property]};
  const orderedSettingsAttributes = createAttributesSettingsOrder(
    resource.attributes,
    resourceSettings?.[resource.id] || []
  );
  resourceSettings[resource.id] = hideOrShowAttributesInSettings(orderedSettingsAttributes, attributeIds, hide);
  attributesSettings[property] = resourceSettings;

  return {...settings, attributes: attributesSettings};
}

function hideOrShowAttributesInSettings(
  attributesSettings: ResourceAttributeSettings[],
  attributeIds: string[],
  hide: boolean
): ResourceAttributeSettings[] {
  const newSettings = [...(attributesSettings || [])];
  for (const attributeId of attributeIds) {
    const attributeIndex = newSettings.findIndex(setting => setting.attributeId === attributeId);
    if (attributeIndex !== -1) {
      newSettings[attributeIndex] = {...newSettings[attributeIndex], hidden: hide};
    }
  }
  return newSettings;
}

function moveAttribute(state: ViewSettingsState, action: ViewSettingsAction.MoveAttribute): ViewSettingsState {
  const {from, to, collection, linkType} = action.payload;
  return moveAttributeInSettings(state, from, to, collection, linkType);
}

function addAttribute(state: ViewSettingsState, action: ViewSettingsAction.AddAttribute): ViewSettingsState {
  const {attributeId, position, collection, linkType} = action.payload;
  return addAttributeToSettings(state, attributeId, position, collection, linkType);
}
