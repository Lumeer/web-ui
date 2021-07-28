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

import {initialUserPermissionsState, UserPermissionsState} from './user-permissions.state';
import {UserPermissionsAction, UserPermissionsActionType} from './user-permissions.action';

export function userPermissionsReducer(
  state: UserPermissionsState = initialUserPermissionsState,
  action: UserPermissionsAction.All
): UserPermissionsState {
  switch (action.type) {
    case UserPermissionsActionType.SET_ORGANIZATION_PERMISSIONS:
      return {...state, currentOrganization: action.payload.permissions};
    case UserPermissionsActionType.SET_PROJECT_PERMISSIONS:
      return {...state, currentProject: action.payload.permissions};
    case UserPermissionsActionType.SET_ORGANIZATIONS_PERMISSIONS:
      return {...state, organizations: action.payload.permissions};
    case UserPermissionsActionType.SET_PROJECTS_PERMISSIONS:
      return {...state, projects: action.payload.permissions};
    case UserPermissionsActionType.SET_COLLECTIONS_PERMISSIONS:
      return {...state, collections: action.payload.permissions};
    case UserPermissionsActionType.SET_LINK_TYPES_PERMISSIONS:
      return {...state, linkTypes: action.payload.permissions};
    case UserPermissionsActionType.SET_VIEWS_PERMISSIONS:
      return {...state, views: action.payload.permissions};
    case UserPermissionsActionType.CLEAR:
      return initialUserPermissionsState;
    default:
      return state;
  }
}
