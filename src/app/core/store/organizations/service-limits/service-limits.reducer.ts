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

import {initialServiceLimitsState, serviceLimitsAdapter, ServiceLimitsState} from "./service-limits.state";
import {ServiceLimitsAction, ServiceLimitsActionType} from "./service-limits.action";

export function serviceLimitsReducer(state: ServiceLimitsState = initialServiceLimitsState, action: ServiceLimitsAction.All): ServiceLimitsState {
  switch (action.type) {
    case ServiceLimitsActionType.GET_ALL_SUCCESS:
      return serviceLimitsAdapter.addAll(action.payload.allServiceLimits, state);
    case ServiceLimitsActionType.GET_SERVICE_LIMITS_SUCCESS:
      return serviceLimitsAdapter.upsertOne({id: action.payload.serviceLimits.organizationId, changes: action.payload.serviceLimits}, state);
    default:
      return state;
  }
}
