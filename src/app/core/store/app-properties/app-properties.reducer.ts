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

import {AppPropertiesState, initialAppPropertiesState} from './app-properties.state';
import {AppPropertiesAction, AppPropertiesActionType} from './app-properties.action';

export function appPropertiesReducer(
  state: AppPropertiesState = initialAppPropertiesState,
  action: AppPropertiesAction.All
): AppPropertiesState {
  switch (action.type) {
    case AppPropertiesActionType.OPEN_TOP_PANEL:
      return {...state, topPanelOpened: true};
    case AppPropertiesActionType.SET_TOP_PANEL_OPENED:
      return {...state, topPanelOpened: action.payload.opened};
    case AppPropertiesActionType.TOGGLE_TOP_PANEL:
      return {...state, topPanelOpened: !state.topPanelOpened};
    case AppPropertiesActionType.SET_FULLSCREEN:
      return {...state, fullscreen: action.payload.opened};
    default:
      return state;
  }
}
