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
import {SelectionList} from '../../../shared/lists/selection/selection-list';

export enum SelectionListsActionType {
  GET = '[Selection Lists] Get',
  GET_SUCCESS = '[Selection Lists] Get :: Success',
  GET_FAILURE = '[Selection Lists] Get :: Failure',

  CREATE = '[Selection Lists] Create',
  CREATE_SUCCESS = '[Selection Lists] Create :: Success',
  CREATE_FAILURE = '[Selection Lists] Create :: Failure',

  UPDATE = '[Selection Lists] Update',
  UPDATE_SUCCESS = '[Selection Lists] Update :: Success',
  UPDATE_FAILURE = '[Selection Lists] Update :: Failure',

  DELETE = '[Selection Lists] Delete',
  DELETE_SUCCESS = '[Selection Lists] Delete :: Success',
  DELETE_FAILURE = '[Selection Lists] Delete :: Failure',
}

export namespace SelectionListsAction {
  export class Get implements Action {
    public readonly type = SelectionListsActionType.GET;

    public constructor(public payload: { organizationId: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = SelectionListsActionType.GET_SUCCESS;

    public constructor(public payload: { organizationId: string; lists: SelectionList[]; }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = SelectionListsActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = SelectionListsActionType.CREATE;

    public constructor(public payload: { organizationId: string; list: SelectionList }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = SelectionListsActionType.CREATE_SUCCESS;

    public constructor(public payload: { list: SelectionList }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = SelectionListsActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = SelectionListsActionType.UPDATE;

    public constructor(public payload: { organizationId: string; list: SelectionList }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = SelectionListsActionType.UPDATE_SUCCESS;

    public constructor(public payload: { list: SelectionList }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = SelectionListsActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = SelectionListsActionType.DELETE;

    public constructor(public payload: { organizationId: string; list: SelectionList }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = SelectionListsActionType.DELETE_SUCCESS;

    public constructor(public payload: { id: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = SelectionListsActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any; list: SelectionList }) {
    }
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
    | DeleteFailure;
}
