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

import {ViewsAction, ViewsActionType} from './views.action';
import {initialViewsState, viewsAdapter, ViewsState} from './views.state';

export function viewsReducer(state: ViewsState = initialViewsState, action: ViewsAction.All): ViewsState {
  switch (action.type) {
    case ViewsActionType.GET_SUCCESS:
      return viewsAdapter.addMany(action.payload.views, {...state, loaded: true});
    case ViewsActionType.CREATE_SUCCESS:
      return viewsAdapter.addOne(action.payload.view, state);
    case ViewsActionType.UPDATE_SUCCESS:
      return viewsAdapter.updateOne({id: action.payload.view.code, changes: action.payload.view}, state);
    case ViewsActionType.DELETE_SUCCESS:
      return viewsAdapter.removeOne(action.payload.viewCode, state);
    case ViewsActionType.CHANGE_CONFIG:
      return {...state, config: action.payload.config};
    case ViewsActionType.CHANGE_DETAIL_CONFIG:
      return {...state, config: {...state.config, detail: action.payload.config}};
    case ViewsActionType.CHANGE_POSTIT_CONFIG:
      return {...state, config: {...state.config, postit: action.payload.config}};
    case ViewsActionType.CHANGE_SEARCH_CONFIG:
      return {...state, config: {...state.config, search: action.payload.config}};
    case ViewsActionType.CHANGE_SMARTDOC_CONFIG:
      return {...state, config: {...state.config, smartdoc: action.payload.config}};
    case ViewsActionType.CHANGE_TABLE_CONFIG:
      return {...state, config: {...state.config, table: action.payload.config}};
    case ViewsActionType.CHANGE_TABLE2_CONFIG:
      return {...state, config: {...state.config, table2: action.payload.config}};
    case ViewsActionType.SET_CURSOR:
      return {...state, cursor: action.payload.cursor};
    case ViewsActionType.CLEAR:
      return initialViewsState;
    default:
      return state;
  }
}
