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
import {DefaultWorkspaceModel, UserModel} from './user.model';
import {SizeType} from '../../../shared/slider/size-type';

export enum UsersActionType {

  GET = '[Users] Get',
  GET_SUCCESS = '[Users] Get :: Success',
  GET_FAILURE = '[Users] Get :: Failure',

  GET_CURRENT_USER = '[Users] Get current user',
  GET_CURRENT_USER_SUCCESS = '[Users] Get current user:: Success',

  SAVE_DEFAULT_WORKSPACE = '[Users] Save default workspace',

  CREATE = '[Users] Create',
  CREATE_SUCCESS = '[Users] Create :: Success',
  CREATE_FAILURE = '[Users] Create :: Failure',

  UPDATE = '[Users] Update',
  UPDATE_SUCCESS = '[Users] Update :: Success',
  UPDATE_FAILURE = '[Users] Update :: Failure',

  DELETE = '[Users] Delete',
  DELETE_SUCCESS = '[Users] Delete :: Success',
  DELETE_FAILURE = '[Users] Delete :: Failure',

  CLEAR = '[Users] Clear',

}

export namespace UsersAction {

  export class Get implements Action {
    public readonly type = UsersActionType.GET;

    public constructor(public payload: { organizationId: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = UsersActionType.GET_SUCCESS;

    public constructor(public payload: { organizationId: string, users: UserModel[] }) {
    }
  }

  export class GetCurrentUser implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER;
  }

  export class GetCurrentUserSuccess implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER_SUCCESS;

    public constructor(public payload: { user: UserModel }) {
    }
  }

  export class SaveDefaultWorkspace implements Action {
    public readonly type = UsersActionType.SAVE_DEFAULT_WORKSPACE;

    public constructor(public payload: { defaultWorkspace: DefaultWorkspaceModel }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = UsersActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = UsersActionType.CREATE;

    public constructor(public payload: { organizationId: string, user: UserModel }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = UsersActionType.CREATE_SUCCESS;

    public constructor(public payload: { user: UserModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = UsersActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = UsersActionType.UPDATE;

    public constructor(public payload: { organizationId: string, user: UserModel }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = UsersActionType.UPDATE_SUCCESS;

    public constructor(public payload: { user: UserModel }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = UsersActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = UsersActionType.DELETE;

    public constructor(public payload: { organizationId: string, userId: string }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = UsersActionType.DELETE_SUCCESS;

    public constructor(public payload: { userId: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = UsersActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Clear implements Action {
    public readonly type = UsersActionType.CLEAR;

    public constructor() {
    }
  }

  export type All = Get | GetSuccess | GetFailure |
    GetCurrentUser | GetCurrentUserSuccess |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateSuccess | UpdateFailure |
    SaveDefaultWorkspace |
    Delete | DeleteSuccess | DeleteFailure | Clear;
}
