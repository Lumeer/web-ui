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

import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, Resource} from '../../core/model/resource';
import {Role} from '../../core/model/role';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {Organization} from '../../core/store/organizations/organization';
import {Permission} from '../../core/store/permissions/permissions';
import {Project} from '../../core/store/projects/project';
import {User} from '../../core/store/users/user';
import {View} from '../../core/store/views/view';

export function userCanReadWorkspace(user: User, organization: Organization, project: Project): boolean {
  if (userHasManageRoleInResource(user, organization)) {
    return true;
  }
  return userHasRoleInResource(user, organization, Role.Read) && userHasRoleInResource(user, project, Role.Read);
}

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

export function generateId(): string {
  return Date.now().toString() + Math.floor((1 + Math.random()) * 1000000000000).toString(16);
}

function rolesWithTransitionRoles(roles: string[]): string[] {
  if (!roles || roles.length === 0) {
    return [];
  }

  return Array.from(
    roles.reduce((rolesTransitionSet, role) => {
      roleWithTransitionRoles(role).forEach(r => rolesTransitionSet.add(r));
      return rolesTransitionSet;
    }, new Set<string>())
  );
}

function roleWithTransitionRoles(role: string): string[] {
  if (role === Role.Manage) {
    return [Role.Read, Role.Write, Role.Comment, Role.Share, Role.Clone, Role.Manage];
  }
  return [role];
}

export function mergePermissions(p1: AllowedPermissions, p2: AllowedPermissions): AllowedPermissions {
  if (!p1 || !p2) {
    return p1 || p2 || {};
  }

  return {
    read: p1.read && p2.read,
    write: p1.write && p2.write,
    manage: p1.manage && p2.manage,
    readWithView: p1.readWithView && p2.readWithView,
    writeWithView: p1.writeWithView && p2.writeWithView,
    manageWithView: p1.manageWithView && p2.manageWithView,
  };
}

export function getAttributesResourceType(attributesResource: AttributesResource): AttributesResourceType {
  if (<LinkType>attributesResource && (<LinkType>attributesResource).collectionIds) {
    return AttributesResourceType.LinkType;
  } else if (<Collection>attributesResource && (<Collection>attributesResource).permissions) {
    return AttributesResourceType.Collection;
  }

  return null;
}

export function sortResourcesByFavoriteAndLastUsed<T extends Resource>(resources: T[]): T[] {
  return (resources || []).sort((a, b) => {
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      if (a.lastTimeUsed && b.lastTimeUsed) {
        return b.lastTimeUsed.getTime() - a.lastTimeUsed.getTime();
      } else if (a.lastTimeUsed && !b.lastTimeUsed) {
        return -1;
      } else if (b.lastTimeUsed && !a.lastTimeUsed) {
        return 1;
      }
      return b.id.localeCompare(a.id);
    }
    return a.favorite ? -1 : 1;
  });
}
