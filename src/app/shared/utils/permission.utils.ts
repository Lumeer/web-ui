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

import {User} from '../../core/store/users/user';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {
  getAdditionalCollectionIdsFromView,
  getAdditionalLinkTypeIdsFromView,
  getAllCollectionIdsFromView,
  getAllLinkTypeIdsFromView,
} from '../../core/store/navigation/query/query.util';
import {AllowedPermissions, AllowedPermissionsMap, ResourcesPermissions} from '../../core/model/allowed-permissions';
import {View} from '../../core/store/views/view';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResource, DataResource, Resource} from '../../core/model/resource';
import {RoleType} from '../../core/model/role-type';
import {Permission, Permissions, Role} from '../../core/store/permissions/permissions';
import {arrayIntersection, flattenMatrix, uniqueValues} from './array.utils';
import {PermissionsType} from '../../core/model/permissions-type';
import {DataResourcePermissions} from '../../core/model/data-resource-permissions';
import {Team} from '../../core/store/teams/team';
import {objectsByIdMap} from './common.utils';
import {rolesAreSame} from '../../core/store/permissions/permissions.helper';
import {
  ConstraintData,
  userCanDeleteDataResource,
  userCanEditDataResource,
  userCanReadDataResource,
} from '@lumeer/data-filters';
import {Perspective} from '../../view/perspectives/perspective';

export function userPermissionsInOrganization(organization: Organization, user: User): AllowedPermissions {
  return {roles: roleTypesToMap(userRoleTypesInOrganization(organization, user))};
}

function roleTypesToMap(roleTypes: RoleType[]): Record<RoleType, boolean> {
  return (roleTypes || []).reduce((map, roleType) => ({...map, [roleType]: true}), {}) as Record<RoleType, boolean>;
}

export function userRoleTypesInOrganization(organization: Organization, user: User): RoleType[] {
  return uniqueValues(userRolesInOrganization(organization, user).map(role => role.type));
}

export function userRolesInOrganization(organization: Organization, user: User): Role[] {
  const teams = getUserTeams(organization, user);
  return userRolesInResource(organization, user, teams);
}

export function teamRolesTypesInOrganization(organization: Organization, team: Team): RoleType[] {
  return uniqueValues(teamRolesInResource(organization, team).map(role => role.type));
}

export function teamRolesInOrganization(organization: Organization, team: Team): Role[] {
  return teamRolesInResource(organization, team);
}

export function userPermissionsInProject(organization: Organization, project: Project, user: User): AllowedPermissions {
  return {roles: roleTypesToMap(userRoleTypesInProject(organization, project, user))};
}

export function userRoleTypesInProject(organization: Organization, project: Project, user: User): RoleType[] {
  return uniqueValues(userRolesInProject(organization, project, user).map(role => role.type));
}

export function teamRoleTypesInProject(organization: Organization, project: Project, team: Team): RoleType[] {
  return uniqueValues(teamRolesInProject(organization, project, team).map(role => role.type));
}

export function userRolesInProject(organization: Organization, project: Project, user: User): Role[] {
  const teams = getUserTeams(organization, user);

  const organizationRoles = userRolesInResource(organization, user, teams);
  if (organizationRoles.some(role => role.type === RoleType.Read)) {
    const projectRoles = userRolesInResource(project, user, teams);
    return [...organizationRoles.filter(role => role.transitive), ...projectRoles];
  }
  return [];
}

export function teamRolesInProject(organization: Organization, project: Project, team: Team): Role[] {
  const organizationRoles = teamRolesInOrganization(organization, team);
  if (organizationRoles.some(role => role.type === RoleType.Read)) {
    const projectRoles = teamRolesInResource(project, team);
    return [...organizationRoles.filter(role => role.transitive), ...projectRoles];
  }
  return [];
}

export function getUserTeams(organization: Organization, user: User): string[] {
  return user?.teams?.map(group => group.id) || [];
}

export function organizationReadableUsersAndTeams(resource: Organization): {
  readableUsers: number;
  readableTeams: number;
} {
  const readableUsers = (resource?.permissions?.users || []).filter(permission =>
    permission.roles?.some(role => role.type === RoleType.Read)
  ).length;
  const readableTeams = (resource?.permissions?.groups || []).filter(permission =>
    permission.roles?.some(role => role.type === RoleType.Read)
  ).length;
  return {readableUsers, readableTeams};
}

export function userPermissionsInCollection(
  organization: Organization,
  project: Project,
  collection: Collection,
  currentView: View,
  linkTypes: LinkType[],
  user: User
): AllowedPermissions {
  if (!collection) {
    return {};
  }
  const roleTypes = userRoleTypesInResource(organization, project, collection, user);
  if (currentView != null) {
    const viewRoleTypes = userCollectionRoleTypesInView(
      organization,
      project,
      currentView,
      collection,
      linkTypes,
      user
    );
    if (getAllCollectionIdsFromView(currentView, linkTypes).includes(collection.id)) {
      const authorRoleTypes = currentView.authorCollectionsRoles?.[collection.id];
      const roleTypesWithView = arrayIntersection(viewRoleTypes, authorRoleTypes);
      return {
        roles: roleTypesToMap(roleTypes),
        rolesWithView: roleTypesToMap(uniqueValues([...roleTypes, ...roleTypesWithView])),
      };
    }
  }
  return {roles: roleTypesToMap(roleTypes), rolesWithView: roleTypesToMap(roleTypes)};
}

function userCollectionRoleTypesInView(
  organization: Organization,
  project: Project,
  view: View,
  collection: Collection,
  linkTypes: LinkType[],
  user: User
): RoleType[] {
  const viewRoleTypes = userRoleTypesInResource(organization, project, view, user);
  const additionalIds = getAdditionalCollectionIdsFromView(view, linkTypes);
  if (view.perspective == Perspective.Form && additionalIds.includes(collection.id)) {
    if (arrayIntersection([RoleType.DataContribute, RoleType.DataWrite], viewRoleTypes).length > 0) {
      viewRoleTypes.push(RoleType.DataRead);
    }
  }

  return uniqueValues(viewRoleTypes);
}

export function userPermissionsInLinkType(
  organization: Organization,
  project: Project,
  linkType: LinkType,
  collections: Collection[],
  currentView: View,
  user: User
): AllowedPermissions {
  if (!linkType) {
    return {};
  }
  const roleTypes = userRoleTypesInLinkType(organization, project, linkType, collections, user);
  if (currentView != null) {
    const viewRoleTypes = userLinkTypeRoleTypesInView(organization, project, currentView, linkType, user);
    const linkTypeIds = getAllLinkTypeIdsFromView(currentView);
    if (linkTypeIds.includes(linkType.id)) {
      const authorRoleTypes = currentView.authorLinkTypesRoles?.[linkType.id];
      const roleTypesWithView = arrayIntersection(viewRoleTypes, authorRoleTypes);
      return {
        roles: roleTypesToMap(roleTypes),
        rolesWithView: roleTypesToMap(uniqueValues([...roleTypes, ...roleTypesWithView])),
      };
    }
  }
  return {roles: roleTypesToMap(roleTypes), rolesWithView: roleTypesToMap(roleTypes)};
}

function userLinkTypeRoleTypesInView(
  organization: Organization,
  project: Project,
  view: View,
  linkType: LinkType,
  user: User
): RoleType[] {
  const viewRoleTypes = userRoleTypesInResource(organization, project, view, user);
  const additionalIds = getAdditionalLinkTypeIdsFromView(view);
  if (view.perspective == Perspective.Form && additionalIds.includes(linkType.id)) {
    if (arrayIntersection([RoleType.DataContribute, RoleType.DataWrite], viewRoleTypes).length > 0) {
      viewRoleTypes.push(RoleType.DataRead);
    }
  }

  return uniqueValues(viewRoleTypes);
}

export function userPermissionsInView(
  organization: Organization,
  project: Project,
  view: View,
  user: User
): AllowedPermissions {
  return {roles: roleTypesToMap(userRoleTypesInResource(organization, project, view, user))};
}

export function userRoleTypesInResource(
  organization: Organization,
  project: Project,
  resource: Resource,
  user: User
): RoleType[] {
  return userRoleTypesInPermissions(organization, project, resource.permissions, user);
}

export function userRoleTypesInLinkType(
  organization: Organization,
  project: Project,
  linkType: LinkType,
  collections: Collection[],
  user: User
): RoleType[] {
  if (linkType.permissionsType === PermissionsType.Custom) {
    return userRoleTypesInPermissions(organization, project, linkType.permissions, user);
  }

  const linkTypeCollections = (collections || []).filter(collection => linkType.collectionIds?.includes(collection.id));
  let canReadCollections = linkTypeCollections.length === 2;
  for (const collection of linkTypeCollections) {
    canReadCollections =
      canReadCollections && userHasRoleInResource(organization, project, collection, user, RoleType.Read);
  }
  if (!canReadCollections) {
    return [];
  }

  const roles1 = userRoleTypesInResource(organization, project, linkTypeCollections[0], user);
  const roles2 = userRoleTypesInResource(organization, project, linkTypeCollections[1], user);
  return arrayIntersection(roles1, roles2);
}

export function userHasRoleInOrganization(organization: Organization, user: User, roleType: RoleType): boolean {
  return userRoleTypesInOrganization(organization, user).includes(roleType);
}

export function teamHasRoleInOrganization(organization: Organization, team: Team, roleType: RoleType): boolean {
  return teamRolesTypesInOrganization(organization, team).includes(roleType);
}

export function userHasRoleInProject(
  organization: Organization,
  project: Project,
  user: User,
  roleType: RoleType
): boolean {
  return userRoleTypesInProject(organization, project, user).includes(roleType);
}

export function teamHasRoleInProject(
  organization: Organization,
  project: Project,
  team: Team,
  roleType: RoleType
): boolean {
  return teamRoleTypesInProject(organization, project, team).includes(roleType);
}

export function userHasRoleInResource(
  organization: Organization,
  project: Project,
  resource: Resource,
  user: User,
  roleType: RoleType
): boolean {
  return userRoleTypesInResource(organization, project, resource, user).includes(roleType);
}

export function userRoleTypesInPermissions(
  organization: Organization,
  project: Project,
  permissions: Permissions,
  user: User
): RoleType[] {
  const teams = getUserTeams(organization, user);
  const roleTypes = [];

  const organizationRoles = userRolesInResource(organization, user, teams);
  if (!organizationRoles.some(role => role.type === RoleType.Read)) {
    return [];
  }
  roleTypes.push(...organizationRoles.filter(role => role.transitive).map(role => role.type));

  const projectRoles = userRolesInResource(project, user, teams);
  if (
    !organizationRoles.some(role => role.type === RoleType.Read && role.transitive) &&
    !projectRoles.some(role => role.type === RoleType.Read)
  ) {
    return [];
  }
  roleTypes.push(...projectRoles.filter(role => role.transitive).map(role => role.type));

  roleTypes.push(...userRolesInPermissions(permissions, user, teams).map(role => role.type));
  return uniqueValues(roleTypes);
}

export function userHasAnyRoleInResource(resource: Resource, user: User): boolean {
  const teamIds = (user.teams || []).map(team => team.id);
  return userRolesInResource(resource, user, teamIds).length > 0;
}

function userRolesInResource(resource: Resource, user: User, teams: string[]): Role[] {
  return userRolesInPermissions(resource?.permissions || {users: [], groups: []}, user, teams);
}

function teamRolesInResource(resource: Resource, team: Team): Role[] {
  return teamRolesInPermissions(resource?.permissions || {users: [], groups: []}, team);
}

function userRolesInPermissions(permissions: Permissions, user: User, groups: string[]): Role[] {
  const userRoles = (user && permissions?.users?.find(permission => permission.id === user.id)?.roles) || [];
  const groupRoles = flattenMatrix(
    permissions?.groups?.filter(permission => groups.includes(permission.id)).map(permission => permission.roles)
  );
  return [...userRoles, ...groupRoles];
}

function teamRolesInPermissions(permissions: Permissions, team: Team): Role[] {
  return (team && permissions?.groups?.find(permission => permission.id === team.id)?.roles) || [];
}

export function userCanReadWorkspace(organization: Organization, project: Project, user: User): boolean {
  return (
    userHasRoleInOrganization(organization, user, RoleType.Read) &&
    userHasRoleInProject(organization, project, user, RoleType.Read)
  );
}

export function teamCanReadWorkspace(organization: Organization, project: Project, team: Team): boolean {
  return (
    teamHasRoleInOrganization(organization, team, RoleType.Read) &&
    teamHasRoleInProject(organization, project, team, RoleType.Read)
  );
}

export function userCanReadAllInOrganization(organization: Organization, user: User): boolean {
  return userRolesInOrganization(organization, user).some(role => role.transitive && role.type === RoleType.Read);
}

export function userCanReadAllInWorkspace(organization: Organization, project: Project, user: User): boolean {
  return userRolesInProject(organization, project, user).some(role => role.transitive && role.type === RoleType.Read);
}

export function userCanManageCollectionDetail(
  organization: Organization,
  project: Project,
  collection: Collection,
  user: User
): boolean {
  const roles = [RoleType.Manage, RoleType.AttributeEdit, RoleType.UserConfig, RoleType.TechConfig];
  return userRoleTypesInResource(organization, project, collection, user).some(role => roles.includes(role));
}

export function permissionsCanManageCollectionDetail(permissions: AllowedPermissions): boolean {
  const roles = [RoleType.Manage, RoleType.AttributeEdit, RoleType.UserConfig, RoleType.TechConfig];
  return roles.some(role => permissions?.roles?.[role]);
}

export function userCanManageProjectDetail(organization: Organization, project: Project, user: User): boolean {
  const roles = [RoleType.Manage, RoleType.UserConfig, RoleType.TechConfig];
  return userRoleTypesInProject(organization, project, user).some(role => roles.includes(role));
}

export function permissionsCanManageProjectDetail(permissions: AllowedPermissions): boolean {
  const roles = [RoleType.Manage, RoleType.UserConfig, RoleType.TechConfig];
  return roles.some(role => permissions?.roles?.[role]);
}

export function userCanManageOrganizationDetail(organization: Organization, user: User): boolean {
  const roles = [RoleType.Manage, RoleType.UserConfig];
  return userRoleTypesInOrganization(organization, user).some(role => roles.includes(role));
}

export function permissionsCanManageOrganizationDetail(permissions: AllowedPermissions): boolean {
  const roles = [RoleType.Manage, RoleType.UserConfig];
  return roles.some(role => permissions?.roles?.[role]);
}

export function dataResourcePermissions(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): DataResourcePermissions {
  return {
    create: permissions?.rolesWithView?.DataContribute,
    read: userCanReadDataResource(dataResource, resource, permissions, user, constraintData),
    edit: userCanEditDataResource(dataResource, resource, permissions, user, constraintData),
    delete: userCanDeleteDataResource(dataResource, resource, permissions, user, constraintData),
  };
}

export function computeResourcesPermissions(
  organization: Organization,
  project: Project,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[],
  currentUser: User
): ResourcesPermissions {
  const collectionsPermissions = (collections || [])
    .filter(collection => !!collection)
    .reduce(
      (map, collection) => ({
        ...map,
        [collection.id]: userPermissionsInCollection(
          organization,
          project,
          collection,
          currentView,
          linkTypes,
          currentUser
        ),
      }),
      {}
    );

  const linkTypesPermissions = (linkTypes || [])
    .filter(linkType => !!linkType)
    .reduce(
      (map, linkType) => ({
        ...map,
        [linkType.id]: userPermissionsInLinkType(
          organization,
          project,
          linkType,
          collections,
          currentView,
          currentUser
        ),
      }),
      {}
    );
  return {collections: collectionsPermissions, linkTypes: linkTypesPermissions};
}

export function computeCollectionsPermissions(
  organization: Organization,
  project: Project,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[],
  currentUser: User
): AllowedPermissionsMap {
  return (collections || [])
    .filter(collection => !!collection)
    .reduce(
      (map, collection) => ({
        ...map,
        [collection.id]: userPermissionsInCollection(
          organization,
          project,
          collection,
          currentView,
          linkTypes,
          currentUser
        ),
      }),
      {}
    );
}

export function computeLinkTypesPermissions(
  organization: Organization,
  project: Project,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[],
  currentUser: User
): AllowedPermissionsMap {
  return (linkTypes || [])
    .filter(linkType => !!linkType)
    .reduce(
      (map, linkType) => ({
        ...map,
        [linkType.id]: userPermissionsInLinkType(
          organization,
          project,
          linkType,
          collections,
          currentView,
          currentUser
        ),
      }),
      {}
    );
}

export function permissionsChanged(p1: Permissions, p2: Permissions): boolean {
  return permissionArrayChanged(p1?.users, p2?.users) || permissionArrayChanged(p1?.groups, p2?.groups);
}

export function permissionArrayChanged(p1: Permission[], p2: Permission[]): boolean {
  const p1Map = objectsByIdMap(p1 || []);
  const p2Map = objectsByIdMap(p2 || []);
  const allKeys = uniqueValues([...Object.keys(p1Map), ...Object.keys(p2Map)]);
  return allKeys.some(key => rolesChanged(p1Map[key]?.roles, p2Map[key]?.roles));
}

export function rolesChanged(roles1: Role[], roles2: Role[]): boolean {
  const otherRoles = [...(roles2 || [])];
  for (const role of roles1 || []) {
    const index = otherRoles.findIndex(r => rolesAreSame(r, role));
    if (index === -1) {
      return true;
    }
    otherRoles.splice(index, 1);
  }
  return otherRoles.length > 0;
}
