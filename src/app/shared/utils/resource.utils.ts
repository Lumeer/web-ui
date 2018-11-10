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

import {ResourceModel} from '../../core/model/resource.model';
import {Role} from '../../core/model/role';
import {UserModel} from '../../core/store/users/user.model';
import {PermissionModel} from '../../core/store/permissions/permissions.model';
import {ViewModel} from '../../core/store/views/view.model';

export function userHasManageRoleInResource(user: UserModel, resource: ResourceModel): boolean {
  return userHasRoleInResource(user, resource, Role.Manage);
}

export function userHasRoleInResource(user: UserModel, resource: ResourceModel, role: string): boolean {
  return userRolesInResource(user, resource).includes(role.toUpperCase());
}

export function userRolesInResource(user: UserModel, resource: ResourceModel): string[] {
  const permissions = (resource && resource.permissions) || {users: [], groups: []};
  const allUserRoles = userRoles(user, permissions.users);
  allUserRoles.push(...userGroupRoles(user, permissions.groups));
  return allUserRoles;
}

function userRoles(user: UserModel, permissions: PermissionModel[]): string[] {
  return permissions.reduce((allRoles, permission) => {
    if (permission.id === user.id) {
      allRoles.push(...permission.roles);
    }
    return allRoles;
  }, []);
}

function userGroupRoles(user: UserModel, permissions: PermissionModel[]): string[] {
  const userGroups = (user.groups || []).map(group => group.id);

  return permissions.reduce((allRoles, permission) => {
    if (userGroups.includes(permission.id)) {
      allRoles.push(...permission.roles);
    }
    return allRoles;
  }, []);
}

export function authorHasRoleInView(view: ViewModel, collectionId: string, role: string): boolean {
  return authorRolesInView(view, collectionId).includes(role.toUpperCase());
}

export function authorRolesInView(view: ViewModel, collectionId: string): string[] {
  const authorRights = view.authorRights || {};
  return authorRights[collectionId] || [];
}

export function generateCorrelationId(): string {
  return Date.now() + ':' + Math.random();
}
