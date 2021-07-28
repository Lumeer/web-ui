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
import {DataQuery} from '../../model/data-query';
import {Query} from '../navigation/query/query';
import {DataQueryPayload} from '../utils/data-query-payload';

export enum DataResourcesActionType {
  GET = '[Data Resources] Get',
  GET_SUCCESS = '[Data Resources] Get :: Success',
  GET_FAILURE = '[Data Resources] Get :: Failure',

  GET_TASKS = '[Data Resources] Get Tasks',
  GET_TASKS_SUCCESS = '[Data Resources] Get Tasks :: Success',
  GET_TASKS_FAILURE = '[Data Resources] Get Tasks :: Failure',

  SET_LOADING_QUERY = '[Data Resources] Set Loading Query',
  SET_LOADING_TASKS_QUERY = '[Data Resources] Set Loading Tasks Query',

  CLEAR_QUERIES = '[Data Resources] Clear Queries',
  CLEAR = '[Data Resources] Clear',
}

export namespace DataResourcesAction {
  export class Get implements Action {
    public readonly type = DataResourcesActionType.GET;

    public constructor(public payload: DataQueryPayload) {}
  }

  export class GetSuccess implements Action {
    public readonly type = DataResourcesActionType.GET_SUCCESS;

    public constructor(public payload: {query: DataQuery}) {}
  }

  export class GetFailure implements Action {
    public readonly type = DataResourcesActionType.GET_FAILURE;

    public constructor(public payload: {error: any; query: DataQuery}) {}
  }

  export class GetTasks implements Action {
    public readonly type = DataResourcesActionType.GET_TASKS;

    public constructor(public payload: DataQueryPayload) {}
  }

  export class GetTasksSuccess implements Action {
    public readonly type = DataResourcesActionType.GET_TASKS_SUCCESS;

    public constructor(public payload: {query: DataQuery}) {}
  }

  export class GetTasksFailure implements Action {
    public readonly type = DataResourcesActionType.GET_TASKS_FAILURE;

    public constructor(public payload: {error: any; query: DataQuery}) {}
  }

  export class ClearQueries implements Action {
    public readonly type = DataResourcesActionType.CLEAR_QUERIES;

    public constructor(public payload: {collectionId?: string}) {}
  }

  export class SetLoadingQuery implements Action {
    public readonly type = DataResourcesActionType.SET_LOADING_QUERY;

    public constructor(public payload: {query: Query}) {}
  }

  export class SetLoadingTasksQuery implements Action {
    public readonly type = DataResourcesActionType.SET_LOADING_TASKS_QUERY;

    public constructor(public payload: {query: Query}) {}
  }

  export class Clear implements Action {
    public readonly type = DataResourcesActionType.CLEAR;
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | GetTasks
    | GetTasksSuccess
    | GetTasksFailure
    | ClearQueries
    | SetLoadingQuery
    | SetLoadingTasksQuery
    | Clear;
}
