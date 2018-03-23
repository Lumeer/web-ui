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

export function organizationsReducer(state: OrganizationsState = initialOrganizationsState, action: OrganizationsAction.All): OrganizationsState {
  switch (action.type) {
    case OrganizationsActionType.GET_SUCCESS:
      return organizationsAdapter.addAll(action.payload.organizations, state);
    case OrganizationsActionType.GET_CODES_SUCCESS:
      return {...state, organizationCodes: action.payload.organizationCodes};
    case OrganizationsActionType.CREATE_SUCCESS:
      const newState = organizationsAdapter.addOne(action.payload.organization, state);
      const organizationCodes = [...state.organizationCodes, action.payload.organization.code];
      return {...newState, organizationCodes};
    case OrganizationsActionType.UPDATE_SUCCESS:
      return organizationsAdapter.updateOne({id: action.payload.organization.id, changes: action.payload.organization}, state);
    case OrganizationsActionType.DELETE_SUCCESS:
      return organizationsAdapter.removeOne(action.payload.organizationId, state);
    case OrganizationsActionType.SELECT:
      return {...state, selectedOrganizationId: action.payload.organizationId};
    default:
      return state;
  }
}
