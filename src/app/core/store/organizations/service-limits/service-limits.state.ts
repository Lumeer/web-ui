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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../../app.state';
import {ServiceLimits} from './service.limits';
import {selectOrganizationByWorkspace} from '../organizations.state';

export interface ServiceLimitsState extends EntityState<ServiceLimits> {}

export const serviceLimitsAdapter = createEntityAdapter<ServiceLimits>({
  selectId: serviceLimits => serviceLimits.organizationId,
});

export const initialServiceLimitsState: ServiceLimitsState = serviceLimitsAdapter.getInitialState({});

export const selectServiceLimitsState = (state: AppState) => state.serviceLimits;
export const selectAllServiceLimits = createSelector(
  selectServiceLimitsState,
  serviceLimitsAdapter.getSelectors().selectAll
);
export const selectServiceLimitsByOrganizationId = organizationId =>
  createSelector(
    selectAllServiceLimits,
    serviceLimits => {
      return serviceLimits.find(serviceLimit => serviceLimit.organizationId === organizationId);
    }
  );
export const selectServiceLimitsByWorkspace = createSelector(
  selectAllServiceLimits,
  selectOrganizationByWorkspace,
  (serviceLimits, organization) => {
    return serviceLimits.find(serviceLimit => organization && serviceLimit.organizationId === organization.id);
  }
);
