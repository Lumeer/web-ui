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
import {LinkType} from '../../core/store/link-types/link.type';
import {Organization} from '../../core/store/organizations/organization';
import {Permission} from '../../core/store/permissions/permissions';
import {Project} from '../../core/store/projects/project';
import {User} from '../../core/store/users/user';
import {View} from '../../core/store/views/view';
import {Collection} from '../../core/store/collections/collection';

export function hasRoleByPermissions(role: Role, permissions: AllowedPermissions): boolean {
  switch (role) {
    case Role.Read:
      return permissions?.readWithView;
    case Role.Write:
      return permissions?.writeWithView;
    case Role.Manage:
      return permissions?.manageWithView;
    default:
      return false;
  }
}

export function managePermissions(): AllowedPermissions {
  return {
    read: true,
    write: true,
    manage: true,
    share: true,
    readWithView: true,
    writeWithView: true,
    manageWithView: true,
  };
}

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

export function userHasRoleInProject(user: User, project: Project, organization: Organization, role: string): boolean {
  return (
    userHasRoleInResource(user, project, role) || (organization && userHasManageRoleInResource(user, organization))
  );
}

export function userHasRoleInResource(user: User, resource: Resource, role: string): boolean {
  return userRolesInResource(user, resource).includes(role.toUpperCase());
}

export function userPermissionsInResource(user: User, resource: Resource): AllowedPermissions {
  const resourceRoles = userRolesInResource(user, resource);
  return {
    read: resourceRoles.includes(Role.Read),
    write: resourceRoles.includes(Role.Write),
    manage: resourceRoles.includes(Role.Manage),
    share: resourceRoles.includes(Role.Share),
    readWithView: resourceRoles.includes(Role.Read),
    writeWithView: resourceRoles.includes(Role.Write),
    manageWithView: resourceRoles.includes(Role.Manage),
  };
}

export function userPermissionsInCollectionByView(user: User, view: View, collection: Collection): AllowedPermissions {
  const resourceRoles = userRolesInResource(user, view);
  const authorRoles = authorRolesInView(view, collection.id);

  const readWithView = resourceRoles.includes(Role.Read) && authorRoles.includes(Role.Read);
  const writeWithView = resourceRoles.includes(Role.Write) && authorRoles.includes(Role.Write);
  const manageWithView = resourceRoles.includes(Role.Manage) && authorRoles.includes(Role.Manage);

  return {readWithView, writeWithView, manageWithView};
}

export function userRolesInResource(user: User, resource: Resource): string[] {
  if (!user) {
    return [];
  }
  const permissions = resource?.permissions || {users: [], groups: []};
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
  // the trailing 'a' makes sure we never end up with a pure numeric string that could be parsed on backed as a number
  // because it does not fit into any basic Java type
  return Date.now().toString() + Math.floor(0x100000000000 + Math.random() * 0xefffffffff).toString(16) + 'a';
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

export function getAttributesResourceType(attributesResource: AttributesResource): AttributesResourceType {
  if (<LinkType>attributesResource && (<LinkType>attributesResource).collectionIds) {
    return AttributesResourceType.LinkType;
  }
  return AttributesResourceType.Collection;
}

export function sortResourcesByFavoriteAndLastUsed<T extends Resource>(resources: T[]): T[] {
  return [...(resources || [])].sort((a, b) => {
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

export function sortResourcesLastUsed<T extends Resource>(resources: T[]): T[] {
  return [...(resources || [])].sort((a, b) => {
    if (a.lastTimeUsed && b.lastTimeUsed) {
      return b.lastTimeUsed.getTime() - a.lastTimeUsed.getTime();
    } else if (a.lastTimeUsed && !b.lastTimeUsed) {
      return -1;
    } else if (b.lastTimeUsed && !a.lastTimeUsed) {
      return 1;
    }
    return b.id.localeCompare(a.id);
  });
}
