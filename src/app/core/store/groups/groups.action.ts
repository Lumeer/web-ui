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
import {Group} from './group';

export enum GroupsActionType {
  GET = '[Groups] Get',
  GET_SUCCESS = '[Groups] Get :: Success',
  GET_FAILURE = '[Groups] Get :: Failure',

  CREATE = '[Groups] Create',
  CREATE_SUCCESS = '[Groups] Create :: Success',
  CREATE_FAILURE = '[Groups] Create :: Failure',

  UPDATE = '[Groups] Update',
  UPDATE_SUCCESS = '[Groups] Update :: Success',
  UPDATE_FAILURE = '[Groups] Update :: Failure',

  DELETE = '[Groups] Delete',
  DELETE_SUCCESS = '[Groups] Delete :: Success',
  DELETE_FAILURE = '[Groups] Delete :: Failure',

  CLEAR = '[Groups] Clear',
}

export namespace GroupsAction {
  export class Get implements Action {
    public readonly type = GroupsActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = GroupsActionType.GET_SUCCESS;

    public constructor(public payload: {groups: Group[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = GroupsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = GroupsActionType.CREATE;

    public constructor(public payload: {group: Group}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = GroupsActionType.CREATE_SUCCESS;

    public constructor(public payload: {group: Group}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = GroupsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = GroupsActionType.UPDATE;

    public constructor(public payload: {group: Group}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = GroupsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {group: Group}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = GroupsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = GroupsActionType.DELETE;

    public constructor(public payload: {groupId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = GroupsActionType.DELETE_SUCCESS;

    public constructor(public payload: {groupId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = GroupsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = GroupsActionType.CLEAR;
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | Clear;
}
