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
import {LinkTypeModel} from './link-type.model';

export enum LinkTypesActionType {
  GET = '[Link Types] Get',
  GET_SUCCESS = '[Link Types] Get :: Success',
  GET_FAILURE = '[Link Types] Get :: Failure',

  CREATE = '[Link Types] Create',
  CREATE_SUCCESS = '[Link Types] Create :: Success',
  CREATE_FAILURE = '[Link Types] Create :: Failure',

  UPDATE = '[Link Types] Update',
  UPDATE_SUCCESS = '[Link Types] Update :: Success',
  UPDATE_FAILURE = '[Link Types] Update :: Failure',

  DELETE = '[Link Types] Delete',
  DELETE_SUCCESS = '[Link Types] Delete :: Success',
  DELETE_FAILURE = '[Link Types] Delete :: Failure',

  CLEAR = '[Link Types] Clear',
}

export namespace LinkTypesAction {
  export class Get implements Action {
    public readonly type = LinkTypesActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = LinkTypesActionType.GET_SUCCESS;

    public constructor(public payload: {linkTypes: LinkTypeModel[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = LinkTypesActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = LinkTypesActionType.CREATE;

    public constructor(public payload: {linkType: LinkTypeModel; callback?: (linkType: LinkTypeModel) => void}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = LinkTypesActionType.CREATE_SUCCESS;

    public constructor(public payload: {linkType: LinkTypeModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = LinkTypesActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = LinkTypesActionType.UPDATE;

    public constructor(public payload: {linkType: LinkTypeModel}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = LinkTypesActionType.UPDATE_SUCCESS;

    public constructor(public payload: {linkType: LinkTypeModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = LinkTypesActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = LinkTypesActionType.DELETE;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = LinkTypesActionType.DELETE_SUCCESS;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = LinkTypesActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = LinkTypesActionType.CLEAR;
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
