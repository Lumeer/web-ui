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

import {Action} from '@ngrx/store';
import {Permission, PermissionType} from '../permissions/permissions';
import {SearchConfig, ViewConfig, ViewCursor, View} from './view';

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

  SET_PERMISSIONS = '[Views] Set Permission',
  SET_PERMISSIONS_SUCCESS = '[Views] Set Permission :: Success',
  SET_PERMISSIONS_FAILURE = '[Views] Set Permission :: Failure',

  CHANGE_CONFIG = '[Views] Change Config',
  CHANGE_DETAIL_CONFIG = '[Views] Change Detail Config',
  CHANGE_POSTIT_CONFIG = '[Views] Change Post-it Config',
  CHANGE_SEARCH_CONFIG = '[Views] Change Search Config',
  CHANGE_SMARTDOC_CONFIG = '[Views] Change Smart Document Config',
  CHANGE_TABLE_CONFIG = '[Views] Change Table Config',

  SET_CURSOR = '[Views] Set Cursor',

  CLEAR = '[Views] Clear',
}

export namespace ViewsAction {
  export class Get implements Action {
    public readonly type = ViewsActionType.GET;

    public constructor(public payload: {force?: boolean}) {}
  }

  export class GetByCode implements Action {
    public readonly type = ViewsActionType.GET_BY_CODE;

    public constructor(public payload: {viewCode: string}) {}
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

    public constructor(public payload: {view: View}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = ViewsActionType.CREATE_SUCCESS;

    public constructor(public payload: {view: View}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = ViewsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = ViewsActionType.UPDATE;

    public constructor(public payload: {viewCode: string; view: View; nextAction?: Action}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = ViewsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {view: View; nextAction?: Action}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = ViewsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class SetPermissions implements Action {
    public readonly type = ViewsActionType.SET_PERMISSIONS;

    public constructor(public payload: {viewCode: string; type: PermissionType; permissions: Permission[]}) {}
  }

  export class SetPermissionsSuccess implements Action {
    public readonly type = ViewsActionType.SET_PERMISSIONS_SUCCESS;

    public constructor(public payload: {viewCode: string; type: PermissionType; permissions: Permission[]}) {}
  }

  export class SetPermissionsFailure implements Action {
    public readonly type = ViewsActionType.SET_PERMISSIONS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = ViewsActionType.DELETE;

    public constructor(public payload: {viewCode: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = ViewsActionType.DELETE_SUCCESS;

    public constructor(public payload: {viewCode: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = ViewsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangeConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_CONFIG;

    public constructor(public payload: {config: ViewConfig}) {}
  }

  export class ChangeSearchConfig implements Action {
    public readonly type = ViewsActionType.CHANGE_SEARCH_CONFIG;

    public constructor(public payload: {config: SearchConfig}) {}
  }

  export class SetCursor implements Action {
    public readonly type = ViewsActionType.SET_CURSOR;

    public constructor(public payload: {cursor: ViewCursor}) {}
  }

  export class Clear implements Action {
    public readonly type = ViewsActionType.CLEAR;
  }

  export type All =
    | GetByCode
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | SetPermissions
    | SetPermissionsSuccess
    | SetPermissionsFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | ChangeConfig
    | ChangeSearchConfig
    | SetCursor
    | Clear;
}
