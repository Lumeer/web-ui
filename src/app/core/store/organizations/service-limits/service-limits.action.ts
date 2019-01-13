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
import {ServiceLimits} from './service.limits';

export enum ServiceLimitsActionType {
  GET_ALL = '[ServiceLimits] Get All',
  GET_ALL_SUCCESS = '[ServiceLimits] Get All :: Success',
  GET_ALL_FAILURE = '[ServiceLimits] Get All :: Failure',

  GET_SERVICE_LIMITS = '[ServiceLimits] Get',
  GET_SERVICE_LIMITS_SUCCESS = '[ServiceLimits] Get :: Success',
  GET_SERVICE_LIMITS_FAILURE = '[ServiceLimits] Get :: Failure',
}

export namespace ServiceLimitsAction {
  export class GetAll implements Action {
    public readonly type = ServiceLimitsActionType.GET_ALL;
  }

  export class GetAllSuccess implements Action {
    public readonly type = ServiceLimitsActionType.GET_ALL_SUCCESS;

    public constructor(public payload: {allServiceLimits: ServiceLimits[]}) {}
  }

  export class GetAllFailure implements Action {
    public readonly type = ServiceLimitsActionType.GET_ALL_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetServiceLimits implements Action {
    public readonly type = ServiceLimitsActionType.GET_SERVICE_LIMITS;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class GetServiceLimitsSuccess implements Action {
    public readonly type = ServiceLimitsActionType.GET_SERVICE_LIMITS_SUCCESS;

    public constructor(public payload: {serviceLimits: ServiceLimits}) {}
  }

  export class GetServiceLimitsFailure implements Action {
    public readonly type = ServiceLimitsActionType.GET_SERVICE_LIMITS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export type All =
    | GetAll
    | GetAllSuccess
    | GetAllFailure
    | GetServiceLimits
    | GetServiceLimitsSuccess
    | GetServiceLimitsFailure;
}
