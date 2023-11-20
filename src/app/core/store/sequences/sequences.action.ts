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

import {Sequence} from '../../model/sequence';

export enum SequencesActionType {
  GET = '[Sequences] Get',
  GET_SUCCESS = '[Sequences] Get :: Success',
  GET_FAILURE = '[Sequences] Get :: Failure',

  UPDATE = '[Sequences] Update',
  UPDATE_SUCCESS = '[Sequences] Update :: Success',
  UPDATE_FAILURE = '[Sequences] Update :: Failure',

  DELETE = '[Sequences] Delete',
  DELETE_SUCCESS = '[Sequences] Delete :: Success',
  DELETE_FAILURE = '[Sequences] Delete :: Failure',
}

export namespace SequencesAction {
  export class Get implements Action {
    public readonly type = SequencesActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = SequencesActionType.GET_SUCCESS;

    public constructor(public payload: {sequences: Sequence[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = SequencesActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = SequencesActionType.UPDATE;

    public constructor(public payload: {sequence: Sequence}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = SequencesActionType.UPDATE_SUCCESS;

    public constructor(public payload: {sequence: Sequence}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = SequencesActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = SequencesActionType.DELETE;

    public constructor(public payload: {sequence: Sequence}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = SequencesActionType.DELETE_SUCCESS;

    public constructor(public payload: {id: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = SequencesActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any; id: string}) {}
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure;
}
