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

import {Action} from '@ngrx/store';
import {Workspace} from '../navigation/workspace';
import {Permission, PermissionType} from '../permissions/permissions';
import {User} from '../users/user';
import {DefaultViewConfig, View} from './view';
import {Perspective} from '../../../view/perspectives/perspective';

export enum ViewsActionType {
  GET = '[Views] Get',
  GET_BY_CODE = '[Views] Get By Code',
  GET_SUCCESS = '[Views] Get :: Success',
  GET_FAILURE = '[Views] Get :: Failure',

  CREATE = '[Views] Create',
  CREATE_SUCCESS = '[Views] Create :: Success',
  CREATE_FAILURE = '[Views] Create :: Failure',

  UPDATE = '[Views] Update',
  UPDATE_SUCCESS = '[Views] Update :: Success',
  UPDATE_FAILURE = '[Views] Update :: Failure',

  DELETE = '[Views] Delete',
  DELETE_SUCCESS = '[Views] Delete :: Success',
  DELETE_FAILURE = '[Views] Delete :: Failure',

  SET_USER_PERMISSIONS = '[Views] Set User Permission',
  SET_PERMISSIONS_SUCCESS = '[Views] Set Permission :: Success',
  SET_PERMISSIONS_FAILURE = '[Views] Set Permission :: Failure',

  ADD_FAVORITE = '[Views] Add Favorite',
  ADD_FAVORITE_SUCCESS = '[Views] Add Favorite :: Success',
  ADD_FAVORITE_FAILURE = '[Views] Add Favorite :: Failure',

  REMOVE_FAVORITE = '[Views] Remove Favorite',
  REMOVE_FAVORITE_SUCCESS = '[Views] Remove Favorite :: Success',
  REMOVE_FAVORITE_FAILURE = '[Views] Remove Favorite :: Failure',

  SET_DEFAULT_CONFIG = '[Views] Set Default Config',
  SET_DEFAULT_CONFIG_SUCCESS = '[Views] Set Default Config :: Success',

  RESET_DEFAULT_CONFIG_BY_SNAPSHOT = '[Views] Reset Default Config By Snapshot',

  GET_DEFAULT_CONFIGS = '[Views] Get Default Configs',
  GET_DEFAULT_CONFIGS_SUCCESS = '[Views] Get Default Configs :: Success',

  SET_DEFAULT_CONFIG_SNAPSHOT = '[Views] Set Default Config Snapshot',

  RESET_VIEW_CONFIG = '[Views] Reset View Config',

  RESET_VIEW_GLOBAL_CONFIG = '[Views] Reset View Global Config',
  SET_SIDEBAR_OPENED = '[Views] Set Sidebar Opened',
  SET_PANEL_WIDTH = '[Views] Set Panel Opened',

  CLEAR = '[Views] Clear',
}

export namespace ViewsAction {
  export class Get implements Action {
    public readonly type = ViewsActionType.GET;

    public constructor(public payload: {workspace?: Workspace; force?: boolean}) {}
  }

  export class GetOne implements Action {
    public readonly type = ViewsActionType.GET_BY_CODE;

    public constructor(public payload: {viewId: string}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = ViewsActionType.GET_SUCCESS;

    public constructor(public payload: {views: View[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = ViewsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = ViewsActionType.CREATE;

    public constructor(
      public payload: {view: View; nextActions?: Action[]; onSuccess?: (View) => void; onFailure?: () => void}
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = ViewsActionType.CREATE_SUCCESS;

    public constructor(public payload: {view: View; nextActions?: Action[]}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = ViewsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = ViewsActionType.UPDATE;

    public constructor(
      public payload: {
        viewId: string;
        view: View;
        onSuccess?: () => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = ViewsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {view: View}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = ViewsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class SetUserPermissions implements Action {
    public readonly type = ViewsActionType.SET_USER_PERMISSIONS;

    public constructor(
      public payload: {
        viewId: string;
        permissions: Permission[];
        newUsers: User[];
        newUsersRoles: Record<string, string[]>;
        onSuccess?: () => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class SetPermissionsSuccess implements Action {
    public readonly type = ViewsActionType.SET_PERMISSIONS_SUCCESS;

    public constructor(public payload: {viewId: string; type: PermissionType; permissions: Permission[]}) {}
  }

  export class SetPermissionsFailure implements Action {
    public readonly type = ViewsActionType.SET_PERMISSIONS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = ViewsActionType.DELETE;

    public constructor(public payload: {viewId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = ViewsActionType.DELETE_SUCCESS;

    public constructor(public payload: {viewId: string; viewCode: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = ViewsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ResetViewGlobalConfig implements Action {
    public readonly type = ViewsActionType.RESET_VIEW_GLOBAL_CONFIG;
  }

  export class SetSidebarOpened implements Action {
    public readonly type = ViewsActionType.SET_SIDEBAR_OPENED;

    public constructor(public payload: {opened: boolean}) {}
  }

  export class SetPanelWidth implements Action {
    public readonly type = ViewsActionType.SET_PANEL_WIDTH;

    public constructor(public payload: {width: number}) {}
  }

  export class AddFavorite implements Action {
    public readonly type = ViewsActionType.ADD_FAVORITE;

    public constructor(public payload: {viewId: string; workspace?: Workspace}) {}
  }

  export class AddFavoriteSuccess implements Action {
    public readonly type = ViewsActionType.ADD_FAVORITE_SUCCESS;

    public constructor(public payload: {viewId: string}) {}
  }

  export class AddFavoriteFailure implements Action {
    public readonly type = ViewsActionType.ADD_FAVORITE_FAILURE;

    public constructor(public payload: {viewId: string; error: any}) {}
  }

  export class RemoveFavorite implements Action {
    public readonly type = ViewsActionType.REMOVE_FAVORITE;

    public constructor(public payload: {viewId: string; workspace?: Workspace}) {}
  }

  export class RemoveFavoriteSuccess implements Action {
    public readonly type = ViewsActionType.REMOVE_FAVORITE_SUCCESS;

    public constructor(public payload: {viewId: string}) {}
  }

  export class RemoveFavoriteFailure implements Action {
    public readonly type = ViewsActionType.REMOVE_FAVORITE_FAILURE;

    public constructor(public payload: {viewId: string; error: any}) {}
  }

  export class GetDefaultConfigs implements Action {
    public readonly type = ViewsActionType.GET_DEFAULT_CONFIGS;

    public constructor(public payload: {workspace: Workspace}) {}
  }

  export class GetDefaultConfigsSuccess implements Action {
    public readonly type = ViewsActionType.GET_DEFAULT_CONFIGS_SUCCESS;

    public constructor(public payload: {configs: DefaultViewConfig[]}) {}
  }

  export class SetDefaultConfig implements Action {
    public readonly type = ViewsActionType.SET_DEFAULT_CONFIG;

    public constructor(public payload: {model: DefaultViewConfig}) {}
  }

  export class ResetViewConfig implements Action {
    public readonly type = ViewsActionType.RESET_VIEW_CONFIG;

    public constructor(public payload: {viewId: string}) {}
  }

  export class SetDefaultConfigSuccess implements Action {
    public readonly type = ViewsActionType.SET_DEFAULT_CONFIG_SUCCESS;

    public constructor(public payload: {model: DefaultViewConfig}) {}
  }

  export class ResetDefaultConfigBySnapshot implements Action {
    public readonly type = ViewsActionType.RESET_DEFAULT_CONFIG_BY_SNAPSHOT;

    public constructor(public payload: {perspective: Perspective}) {}
  }

  export class SetDefaultConfigSnapshot implements Action {
    public readonly type = ViewsActionType.SET_DEFAULT_CONFIG_SNAPSHOT;

    public constructor(public payload: {model?: DefaultViewConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = ViewsActionType.CLEAR;
  }

  export type All =
    | GetOne
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | SetUserPermissions
    | SetPermissionsSuccess
    | SetPermissionsFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | ResetViewGlobalConfig
    | AddFavorite
    | AddFavoriteSuccess
    | AddFavoriteFailure
    | RemoveFavorite
    | RemoveFavoriteSuccess
    | RemoveFavoriteFailure
    | SetSidebarOpened
    | SetPanelWidth
    | SetDefaultConfig
    | ResetDefaultConfigBySnapshot
    | ResetViewConfig
    | SetDefaultConfigSuccess
    | SetDefaultConfigSnapshot
    | GetDefaultConfigs
    | GetDefaultConfigsSuccess
    | Clear;
}
