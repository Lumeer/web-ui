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
import {
  addAttributeToSettings,
  createAndModifyAttributesSettings,
  moveAttributeInSettings,
} from '../../../shared/settings/settings.util';
import {AttributesResourceType} from '../../model/resource';

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
    case ViewSettingsActionType.SET_ATTRIBUTE:
      return setAttribute(state, action);
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
  const resourceType = linkType ? AttributesResourceType.LinkType : AttributesResourceType.Collection;
  return createAndModifyAttributesSettings(state, linkType || collection, resourceType, settingsAttributes => {
    for (const attributeId of attributeIds) {
      const attributeIndex = settingsAttributes.findIndex(setting => setting.attributeId === attributeId);
      if (attributeIndex !== -1) {
        settingsAttributes[attributeIndex] = {...settingsAttributes[attributeIndex], hidden: hide};
      }
    }
    return settingsAttributes;
  });
}

function moveAttribute(state: ViewSettingsState, action: ViewSettingsAction.MoveAttribute): ViewSettingsState {
  const {from, to, collection, linkType} = action.payload;
  return moveAttributeInSettings(state, from, to, collection, linkType);
}

function addAttribute(state: ViewSettingsState, action: ViewSettingsAction.AddAttribute): ViewSettingsState {
  const {attributeId, position, collection, linkType} = action.payload;
  return addAttributeToSettings(state, attributeId, position, collection, linkType);
}

function setAttribute(state: ViewSettingsState, action: ViewSettingsAction.SetAttribute): ViewSettingsState {
  const {attributeId, settings, collection, linkType} = action.payload;
  const resourceType = linkType ? AttributesResourceType.LinkType : AttributesResourceType.Collection;
  return createAndModifyAttributesSettings(state, linkType || collection, resourceType, settingAttributes => {
    const attributeIndex = settingAttributes.findIndex(setting => setting.attributeId === attributeId);
    if (attributeIndex !== -1) {
      settingAttributes[attributeIndex] = {...settingAttributes[attributeIndex], ...settings};
    }
    return settingAttributes;
  });
}
