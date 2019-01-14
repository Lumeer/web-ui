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

import {OrganizationsAction, OrganizationsActionType} from './organizations.action';
import {initialOrganizationsState, organizationsAdapter, OrganizationsState} from './organizations.state';
import {PermissionsHelper} from '../permissions/permissions.helper';
import {Organization} from './organization';

export function organizationsReducer(
  state: OrganizationsState = initialOrganizationsState,
  action: OrganizationsAction.All
): OrganizationsState {
  switch (action.type) {
    case OrganizationsActionType.GET_SUCCESS:
      return addOrganizations(state, action.payload.organizations);
    case OrganizationsActionType.GET_ONE_SUCCESS:
      return addOrUpdateOrganization(state, action.payload.organization);
    case OrganizationsActionType.GET_CODES_SUCCESS:
      return {...state, organizationCodes: action.payload.organizationCodes};
    case OrganizationsActionType.CREATE_SUCCESS:
      return addOrUpdateOrganization(state, action.payload.organization);
    case OrganizationsActionType.UPDATE_SUCCESS:
      return addOrUpdateOrganization(state, action.payload.organization);
    case OrganizationsActionType.DELETE_SUCCESS:
      return organizationsAdapter.removeOne(action.payload.organizationId, state);
    case OrganizationsActionType.SELECT:
      return {...state, selectedOrganizationId: action.payload.organizationId};
    case OrganizationsActionType.CHANGE_PERMISSION_SUCCESS:
      return onChangePermission(state, action);
    case OrganizationsActionType.CHANGE_PERMISSION_FAILURE:
      return onChangePermission(state, action);
    default:
      return state;
  }
}

function addOrganizations(state: OrganizationsState, organizations: Organization[]): OrganizationsState {
  const newState = {...state, loaded: true};
  const filteredOrganizations = organizations.filter(organization => {
    const oldOrganization = state.entities[organization.id];
    return !oldOrganization || isOrganizationNewer(organization, oldOrganization);
  });

  return organizationsAdapter.addMany(filteredOrganizations, newState);
}

function addOrUpdateOrganization(state: OrganizationsState, organization: Organization): OrganizationsState {
  const oldOrganization = state.entities[organization.id];
  if (!oldOrganization) {
    return organizationsAdapter.addOne(organization, state);
  }

  if (isOrganizationNewer(organization, oldOrganization)) {
    return organizationsAdapter.upsertOne(organization, state);
  }
  return state;
}

function isOrganizationNewer(organization: Organization, oldOrganization: Organization): boolean {
  return organization.version && (!oldOrganization.version || organization.version > oldOrganization.version);
}

function onChangePermission(
  state: OrganizationsState,
  action: OrganizationsAction.ChangePermissionSuccess | OrganizationsAction.ChangePermissionFailure
): OrganizationsState {
  const organization = state.entities[action.payload.organizationId];
  const permissions = PermissionsHelper.changePermission(
    organization.permissions,
    action.payload.type,
    action.payload.permission
  );

  return organizationsAdapter.updateOne(
    {id: action.payload.organizationId, changes: {permissions: permissions}},
    state
  );
}
