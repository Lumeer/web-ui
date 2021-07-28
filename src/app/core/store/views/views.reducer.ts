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

import {DefaultViewConfig, View} from './view';
import {ViewsAction, ViewsActionType} from './views.action';
import {initialViewsState, viewsAdapter, ViewsState} from './views.state';
import {deepObjectCopy} from '../../../shared/utils/common.utils';
import {permissionsChanged} from '../../../shared/utils/permission.utils';

export function viewsReducer(state: ViewsState = initialViewsState, action: ViewsAction.All): ViewsState {
  switch (action.type) {
    case ViewsActionType.GET_SUCCESS:
      return addViews(state, action.payload.views);
    case ViewsActionType.CREATE_SUCCESS:
      return addOrUpdateView(state, action.payload.view);
    case ViewsActionType.UPDATE_SUCCESS:
      return addOrUpdateView(state, action.payload.view);
    case ViewsActionType.DELETE_SUCCESS:
      return viewsAdapter.removeOne(action.payload.viewId, state);
    case ViewsActionType.SET_PERMISSIONS_SUCCESS:
      return onSetPermissions(state, action);
    case ViewsActionType.RESET_VIEW_GLOBAL_CONFIG:
      return {...state, globalConfig: {}};
    case ViewsActionType.SET_VIEW_FOLDERS:
      return viewsAdapter.updateOne({id: action.payload.viewId, changes: {folders: action.payload.folders}}, state);
    case ViewsActionType.SET_VIEW_FOLDERS_FAILURE:
      return viewsAdapter.updateOne(
        {id: action.payload.viewId, changes: {folders: action.payload.previousFolders}},
        state
      );
    case ViewsActionType.SET_SIDEBAR_OPENED:
      return {...state, globalConfig: {...state.globalConfig, sidebarOpened: action.payload.opened}};
    case ViewsActionType.SET_PANEL_WIDTH:
      return {...state, globalConfig: {...state.globalConfig, panelWidth: action.payload.width}};
    case ViewsActionType.ADD_FAVORITE_SUCCESS:
      return viewsAdapter.updateOne({id: action.payload.viewId, changes: {favorite: true}}, state);
    case ViewsActionType.REMOVE_FAVORITE_SUCCESS:
      return viewsAdapter.updateOne({id: action.payload.viewId, changes: {favorite: false}}, state);
    case ViewsActionType.ADD_FAVORITE_FAILURE:
      return viewsAdapter.updateOne({id: action.payload.viewId, changes: {favorite: false}}, state);
    case ViewsActionType.REMOVE_FAVORITE_FAILURE:
      return viewsAdapter.updateOne({id: action.payload.viewId, changes: {favorite: true}}, state);
    case ViewsActionType.SET_DEFAULT_CONFIG_SUCCESS:
      return setDefaultConfig(state, action);
    case ViewsActionType.GET_DEFAULT_CONFIGS_SUCCESS:
      return updateDefaultConfigs(state, action.payload.configs);
    case ViewsActionType.SET_DEFAULT_CONFIG_SNAPSHOT:
      return {...state, defaultConfigSnapshot: action.payload.model};
    case ViewsActionType.CLEAR:
      return initialViewsState;
    default:
      return state;
  }
}

function setDefaultConfig(state: ViewsState, action: ViewsAction.SetDefaultConfigSuccess): ViewsState {
  const defaultConfigs = deepObjectCopy(state.defaultConfigs);
  setDefaultConfigInMap(defaultConfigs, action.payload.model);

  return {...state, defaultConfigs};
}

function setDefaultConfigInMap(
  configs: Record<string, Record<string, DefaultViewConfig>>,
  newConfig: DefaultViewConfig
) {
  if (!configs[newConfig.perspective]) {
    configs[newConfig.perspective] = {};
  }

  const perspectiveConfig = configs[newConfig.perspective];
  const currentConfig = perspectiveConfig[newConfig.key];
  if (!currentConfig || !currentConfig.updatedAt || currentConfig.updatedAt.getTime() < newConfig.updatedAt.getTime()) {
    perspectiveConfig[newConfig.key] = newConfig;
  }
}

function updateDefaultConfigs(state: ViewsState, configs: DefaultViewConfig[]): ViewsState {
  const defaultConfigs = (configs || []).reduce((map, config) => {
    setDefaultConfigInMap(map, config);
    return map;
  }, {});

  return {...state, defaultConfigs, defaultConfigsLoaded: true};
}

function addViews(state: ViewsState, views: View[]): ViewsState {
  const newState = {...state, loaded: true};
  const filteredViews = views.filter(view => {
    const oldView = state.entities[view.id];
    return !oldView || isViewNewer(view, oldView);
  });
  return viewsAdapter.upsertMany(filteredViews, newState);
}

function addOrUpdateView(state: ViewsState, view: View): ViewsState {
  const oldView = state.entities[view.id];
  if (!oldView) {
    return viewsAdapter.addOne(view, state);
  }

  if (isViewNewer(view, oldView)) {
    return viewsAdapter.upsertOne(view, state);
  }
  return state;
}

function isViewNewer(view: View, oldView: View): boolean {
  return (
    view.version &&
    (!oldView.version || view.version > oldView.version || permissionsChanged(view.permissions, oldView.permissions))
  );
}

function onSetPermissions(state: ViewsState, action: ViewsAction.SetPermissionsSuccess): ViewsState {
  return viewsAdapter.updateOne({id: action.payload.viewId, changes: {permissions: action.payload.permissions}}, state);
}
