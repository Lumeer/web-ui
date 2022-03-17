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
import {ResourceType} from '../../model/resource-type';
import {ResourceCommentModel} from './resource-comment.model';

export enum ResourceCommentsActionType {
  GET = '[ResourceComments] Get',
  GET_SUCCESS = '[ResourceComments] Get :: Success',
  GET_FAILURE = '[ResourceComments] Get :: Failure',

  CREATE = '[ResourceComments] Create',
  CREATE_SUCCESS = '[ResourceComments] Create :: Success',
  CREATE_FAILURE = '[ResourceComments] Create :: Failure',

  UPDATE = '[ResourceComments] Update',
  UPDATE_SUCCESS = '[ResourceComments] Update :: Success',
  UPDATE_FAILURE = '[ResourceComments] Update :: Failure',

  DELETE = '[ResourceComments] Delete',
  DELETE_UNINITIALIZED = '[ResourceComments] Delete Uninitialized',
  DELETE_SUCCESS = '[ResourceComments] Delete :: Success',
  DELETE_FAILURE = '[ResourceComments] Delete :: Failure',
}

export namespace ResourceCommentsAction {
  export class Get implements Action {
    public readonly type = ResourceCommentsActionType.GET;

    public constructor(
      public payload: {
        resourceType: ResourceType;
        resourceId: string;
        pageStart?: number;
        pageLength?: number;
        workspace?: Workspace;
      }
    ) {}
  }

  export class GetSuccess implements Action {
    public readonly type = ResourceCommentsActionType.GET_SUCCESS;

    public constructor(public payload: {resourceComments: ResourceCommentModel[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = ResourceCommentsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = ResourceCommentsActionType.CREATE;

    public constructor(
      public payload: {
        comment: ResourceCommentModel;
        workspace?: Workspace;
        onSuccess?: (commentId: string) => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = ResourceCommentsActionType.CREATE_SUCCESS;

    public constructor(public payload: {comment: ResourceCommentModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = ResourceCommentsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any; correlationId?: string}) {}
  }

  export class Update implements Action {
    public readonly type = ResourceCommentsActionType.UPDATE;

    public constructor(public payload: {comment: ResourceCommentModel; workspace?: Workspace}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = ResourceCommentsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {comment: ResourceCommentModel; originalComment?: ResourceCommentModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = ResourceCommentsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any; originalComment: ResourceCommentModel}) {}
  }

  export class Delete implements Action {
    public readonly type = ResourceCommentsActionType.DELETE;

    public constructor(public payload: {comment: ResourceCommentModel; workspace?: Workspace; nextAction?: Action}) {}
  }

  export class DeleteUninitialized implements Action {
    public readonly type = ResourceCommentsActionType.DELETE_UNINITIALIZED;

    public constructor(public payload: {comment: ResourceCommentModel}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = ResourceCommentsActionType.DELETE_SUCCESS;

    public constructor(public payload: {comment: ResourceCommentModel}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = ResourceCommentsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any; originalComment?: ResourceCommentModel}) {}
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
    | DeleteUninitialized
    | DeleteSuccess
    | DeleteFailure;
}
