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
import {QueryModel} from '../navigation/query.model';
import {LinkInstanceModel} from './link-instance.model';

export enum LinkInstancesActionType {
  GET = '[Link Instances] Get',
  GET_SUCCESS = '[Link Instances] Get :: Success',
  GET_FAILURE = '[Link Instances] Get :: Failure',

  CREATE = '[Link Instances] Create',
  CREATE_SUCCESS = '[Link Instances] Create :: Success',
  CREATE_FAILURE = '[Link Instances] Create :: Failure',

  UPDATE = '[Link Instances] Update',
  UPDATE_SUCCESS = '[Link Instances] Update :: Success',
  UPDATE_FAILURE = '[Link Instances] Update :: Failure',

  DELETE = '[Link Instances] Delete',
  DELETE_CONFIRM = '[Link Instances] Delete :: Confirm',
  DELETE_SUCCESS = '[Link Instances] Delete :: Success',
  DELETE_FAILURE = '[Link Instances] Delete :: Failure',

  CLEAR = '[Link Instances] Clear',
}

export namespace LinkInstancesAction {
  export class Get implements Action {
    public readonly type = LinkInstancesActionType.GET;

    public constructor(public payload: {query: QueryModel}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = LinkInstancesActionType.GET_SUCCESS;

    public constructor(public payload: {linkInstances: LinkInstanceModel[]; query: QueryModel}) {}
  }

  export class GetFailure implements Action {
    public readonly type = LinkInstancesActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = LinkInstancesActionType.CREATE;

    public constructor(
      public payload: {linkInstance: LinkInstanceModel; callback?: (linkInstanceId: string) => void}
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = LinkInstancesActionType.CREATE_SUCCESS;

    public constructor(public payload: {linkInstance: LinkInstanceModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = LinkInstancesActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = LinkInstancesActionType.UPDATE;

    public constructor(public payload: {linkInstance: LinkInstanceModel}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_SUCCESS;

    public constructor(public payload: {linkInstance: LinkInstanceModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = LinkInstancesActionType.DELETE;

    public constructor(public payload: {linkInstanceId: string; callback?: (linkInstanceId: string) => void}) {}
  }

  export class DeleteConfirm implements Action {
    public readonly type = LinkInstancesActionType.DELETE_CONFIRM;

    public constructor(public payload: {linkInstanceId: string; callback?: (linkInstanceId: string) => void}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = LinkInstancesActionType.DELETE_SUCCESS;

    public constructor(public payload: {linkInstanceId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = LinkInstancesActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = LinkInstancesActionType.CLEAR;
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
    | DeleteConfirm
    | DeleteSuccess
    | DeleteFailure
    | Clear;
}
