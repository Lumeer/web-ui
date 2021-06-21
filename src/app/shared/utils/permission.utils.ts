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
import {getAllCollectionIdsFromQuery, getAllLinkTypeIdsFromQuery} from '../../core/store/navigation/query/query.util';
import {AllowedPermissions, ResourcesPermissions} from '../../core/model/allowed-permissions';
import {View} from '../../core/store/views/view';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResource, AttributesResourceType, DataResource, Resource} from '../../core/model/resource';
import {RoleType} from '../../core/model/role-type';
import {Permissions, Role} from '../../core/store/permissions/permissions';
import {arrayIntersection, flattenMatrix, uniqueValues} from './array.utils';
import {PermissionsType} from '../../core/model/permissions-type';
import {DocumentModel} from '../../core/store/documents/document.model';
import {isDocumentOwnerByPurpose} from '../../core/store/documents/document.utils';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {getAttributesResourceType} from './resource.utils';
import {DataResourcePermissions} from '../../core/model/data-resource-permissions';

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
  const groups = getUserGroups(organization, user);
  return userRolesInResource(organization, user, groups);
}

export function userPermissionsInProject(organization: Organization, project: Project, user: User): AllowedPermissions {
  return {roles: roleTypesToMap(userRoleTypesInProject(organization, project, user))};
}

export function userRoleTypesInProject(organization: Organization, project: Project, user: User): RoleType[] {
  return uniqueValues(userRolesInProject(organization, project, user).map(role => role.type));
}

export function userRolesInProject(organization: Organization, project: Project, user: User): Role[] {
  const groups = getUserGroups(organization, user);

  const organizationRoles = userRolesInResource(organization, user, groups);
  if (organizationRoles.some(role => role.type === RoleType.Read)) {
    const projectRoles = userRolesInResource(project, user, groups);
    return [...organizationRoles.filter(role => role.transitive), ...projectRoles];
  }
  return [];
}

export function getUserGroups(organization: Organization, user: User): string[] {
  return user.groups?.[organization?.id] || [];
}

export function userPermissionsInCollection(
  organization: Organization,
  project: Project,
  collection: Collection,
  currentView: View,
  linkTypes: LinkType[],
  user: User
): AllowedPermissions {
  const roleTypes = userRoleTypesInResource(organization, project, collection, user);
  if (currentView != null) {
    const viewRoleTypes = userRoleTypesInResource(organization, project, currentView, user);
    const collectionIds = getAllCollectionIdsFromQuery(currentView.query, linkTypes);
    if (collectionIds.includes(collection.id)) {
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

export function userPermissionsInLinkType(
  organization: Organization,
  project: Project,
  linkType: LinkType,
  collections: Collection[],
  currentView: View,
  user: User
): AllowedPermissions {
  const roleTypes = userRoleTypesInLinkType(organization, project, linkType, collections, user);
  if (currentView != null) {
    const viewRoleTypes = userRoleTypesInResource(organization, project, currentView, user);
    const linkTypeIds = getAllLinkTypeIdsFromQuery(currentView.query);
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
  if (linkType.permissionsType == PermissionsType.Custom) {
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

export function userHasRoleInProject(
  organization: Organization,
  project: Project,
  user: User,
  roleType: RoleType
): boolean {
  return userRoleTypesInProject(organization, project, user).includes(roleType);
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
  const groups = getUserGroups(organization, user);
  const roleTypes = [];

  const organizationRoles = userRolesInResource(organization, user, groups);
  if (!organizationRoles.some(role => role.type === RoleType.Read)) {
    return [];
  }
  roleTypes.push(...organizationRoles.filter(role => role.transitive).map(role => role.type));

  const projectRoles = userRolesInResource(project, user, groups);
  if (
    !organizationRoles.some(role => role.type === RoleType.Read && role.transitive) &&
    !projectRoles.some(role => role.type === RoleType.Read)
  ) {
    return [];
  }
  roleTypes.push(...projectRoles.filter(role => role.transitive).map(role => role.type));

  roleTypes.push(...userRolesInPermissions(permissions, user, groups).map(role => role.type));
  return uniqueValues(roleTypes);
}

function userRolesInResource(resource: Resource, user: User, groups: string[]): Role[] {
  return userRolesInPermissions(resource.permissions, user, groups);
}

function userRolesInPermissions(permissions: Permissions, user: User, groups: string[]): Role[] {
  const userRoles = (user && permissions?.users?.find(permission => permission.id === user.id)?.roles) || [];
  const groupRoles = flattenMatrix(
    permissions?.groups?.filter(permission => groups.includes(permission.id)).map(permission => permission.roles)
  );
  return [...userRoles, ...groupRoles];
}

export function userCanReadWorkspace(organization: Organization, project: Project, user: User): boolean {
  return userRoleTypesInProject(organization, project, user).includes(RoleType.Read);
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
  const roles = [RoleType.Manage, RoleType.UserConfig, RoleType.TechConfig];
  return userRoleTypesInResource(organization, project, collection, user).some(role => roles.includes(role));
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
  user: User
): DataResourcePermissions {
  return {
    read: userCanReadDataResource(dataResource, resource, permissions, user),
    edit: userCanEditDataResource(dataResource, resource, permissions, user),
    delete: userCanDeleteDataResource(dataResource, resource, permissions, user),
  };
}

export function userCanReadDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User
): boolean {
  const resourceType = getAttributesResourceType(resource);
  if (resourceType === AttributesResourceType.Collection) {
    return userCanReadDocument(dataResource as DocumentModel, resource, permissions, user);
  } else if (resourceType === AttributesResourceType.LinkType) {
    return userCanReadLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
  }
  return false;
}

export function userCanEditDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User
): boolean {
  const resourceType = getAttributesResourceType(resource);
  if (resourceType === AttributesResourceType.Collection) {
    return userCanEditDocument(dataResource as DocumentModel, resource, permissions, user);
  } else if (resourceType === AttributesResourceType.LinkType) {
    return userCanEditLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
  }
  return false;
}

export function userCanDeleteDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User
): boolean {
  const resourceType = getAttributesResourceType(resource);
  if (resourceType === AttributesResourceType.Collection) {
    return userCanDeleteDocument(dataResource as DocumentModel, resource, permissions, user);
  } else if (resourceType === AttributesResourceType.LinkType) {
    return userCanDeleteLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
  }
  return false;
}

export function userCanReadDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataRead ||
    (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user))
  );
}

export function userCanEditDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataWrite ||
    (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user))
  );
}

export function userCanDeleteDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataDelete ||
    (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user))
  );
}

function isDocumentOwner(document: DocumentModel, collection: Collection, user: User): boolean {
  return (user && document?.createdBy == user.id) || isDocumentOwnerByPurpose(document, collection, user);
}

export function userCanReadLinkInstance(
  document: LinkInstance,
  linkType: LinkType,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataRead ||
    (permissions?.rolesWithView?.DataContribute && isLinkOwner(document, linkType, user))
  );
}

export function userCanEditLinkInstance(
  document: LinkInstance,
  linkType: LinkType,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataWrite ||
    (permissions?.rolesWithView?.DataContribute && isLinkOwner(document, linkType, user))
  );
}

export function userCanDeleteLinkInstance(
  document: LinkInstance,
  linkType: LinkType,
  permissions: AllowedPermissions,
  user: User
): boolean {
  return (
    permissions?.rolesWithView?.DataDelete ||
    (permissions?.rolesWithView?.DataContribute && isLinkOwner(document, linkType, user))
  );
}

function isLinkOwner(document: LinkInstance, linkType: LinkType, user: User): boolean {
  return document.createdBy == user.id;
}

export function computeResourcesPermissions(
  organization: Organization,
  project: Project,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[],
  currentUser: User
): ResourcesPermissions {
  const collectionsPermissions = (collections || []).reduce(
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

  const linkTypesPermissions = (linkTypes || []).reduce(
    (map, linkType) => ({
      ...map,
      [linkType.id]: userPermissionsInLinkType(organization, project, linkType, collections, currentView, currentUser),
    }),
    {}
  );
  return {collections: collectionsPermissions, linkTypes: linkTypesPermissions};
}
