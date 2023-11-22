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

import {Team} from './team';

export enum TeamsActionType {
  GET_ALL_SUCCESS = '[Teams] Get All :: Success',

  GET = '[Teams] Get',
  GET_SUCCESS = '[Teams] Get :: Success',
  GET_FAILURE = '[Teams] Get :: Failure',

  CREATE = '[Teams] Create',
  CREATE_SUCCESS = '[Teams] Create :: Success',
  CREATE_FAILURE = '[Teams] Create :: Failure',

  UPDATE = '[Teams] Update',
  UPDATE_SUCCESS = '[Teams] Update :: Success',
  UPDATE_FAILURE = '[Teams] Update :: Failure',

  DELETE = '[Teams] Delete',
  DELETE_SUCCESS = '[Teams] Delete :: Success',
  DELETE_FAILURE = '[Teams] Delete :: Failure',

  CLEAR = '[Teams] Clear',
}

export namespace TeamsAction {
  export class GetAllSuccess implements Action {
    public readonly type = TeamsActionType.GET_ALL_SUCCESS;

    public constructor(public payload: {teamsByOrganizations: Record<string, Team[]>}) {}
  }

  export class Get implements Action {
    public readonly type = TeamsActionType.GET;

    public constructor(public payload: {organizationId: string; force?: boolean}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = TeamsActionType.GET_SUCCESS;

    public constructor(public payload: {organizationId: string; teams: Team[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = TeamsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = TeamsActionType.CREATE;

    public constructor(public payload: {team: Team}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = TeamsActionType.CREATE_SUCCESS;

    public constructor(public payload: {team: Team}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = TeamsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = TeamsActionType.UPDATE;

    public constructor(public payload: {team: Team}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = TeamsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {team: Team}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = TeamsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = TeamsActionType.DELETE;

    public constructor(public payload: {teamId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = TeamsActionType.DELETE_SUCCESS;

    public constructor(public payload: {teamId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = TeamsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = TeamsActionType.CLEAR;
  }

  export type All =
    | GetAllSuccess
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
