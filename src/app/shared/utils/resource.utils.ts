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

import {Resource} from '../../core/model/resource';
import {Role} from '../../core/model/role';
import {User} from '../../core/store/users/user';
import {Permission} from '../../core/store/permissions/permissions';
import {View} from '../../core/store/views/view';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';

export function userIsManagerInWorkspace(user: User, organization?: Organization, project?: Project): boolean {
  return (
    (organization && userHasManageRoleInResource(user, organization)) ||
    (project && userHasManageRoleInResource(user, project))
  );
}

export function userHasManageRoleInResource(user: User, resource: Resource): boolean {
  return userHasRoleInResource(user, resource, Role.Manage);
}

export function userHasRoleInResource(user: User, resource: Resource, role: string): boolean {
  return userRolesInResource(user, resource).includes(role.toUpperCase());
}

export function userRolesInResource(user: User, resource: Resource): string[] {
  if (!user) {
    return [];
  }
  const permissions = (resource && resource.permissions) || {users: [], groups: []};
  const allUserRoles = userRoles(user, permissions.users);
  allUserRoles.push(...userGroupRoles(user, permissions.groups));
  return rolesWithTransitionRoles(allUserRoles);
}

function userRoles(user: User, permissions: Permission[]): string[] {
  return permissions.reduce((allRoles, permission) => {
    if (permission.id === user.id) {
      allRoles.push(...permission.roles);
    }
    return allRoles;
  }, []);
}

function userGroupRoles(user: User, permissions: Permission[]): string[] {
  const userGroups = (user.groups || []).map(group => group.id);

  return permissions.reduce((allRoles, permission) => {
    if (userGroups.includes(permission.id)) {
      allRoles.push(...permission.roles);
    }
    return allRoles;
  }, []);
}

export function authorHasRoleInView(view: View, collectionId: string, role: string): boolean {
  return authorRolesInView(view, collectionId).includes(role.toUpperCase());
}

export function authorRolesInView(view: View, collectionId: string): string[] {
  const authorRights = view.authorRights || {};
  return rolesWithTransitionRoles(authorRights[collectionId] || []);
}

export function generateCorrelationId(): string {
  return Date.now() + ':' + Math.random();
}

function rolesWithTransitionRoles(roles: string[]): string[] {
  if (!roles || roles.length === 0) {
    return [];
  }
  const rolesTransition = roles.reduce((arr, role) => [...arr, ...roleWithTransitionRoles(role)], []);
  const rolesTransitionSet = new Set(rolesTransition);
  return Array.from(rolesTransitionSet);
}

function roleWithTransitionRoles(role: string): string[] {
  if (role === Role.Manage) {
    return [Role.Read, Role.Write, Role.Comment, Role.Share, Role.Clone, Role.Manage];
  }
  return [role];
}
