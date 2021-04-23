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
  managePermissions,
  userIsManagerInWorkspace,
  userPermissionsInCollectionByView,
  userPermissionsInResource,
} from './resource.utils';
import {getAllCollectionIdsFromQuery} from '../../core/store/navigation/query/query.util';
import {AllowedPermissionsMap, mergeAllowedPermissions} from '../../core/model/allowed-permissions';
import {View} from '../../core/store/views/view';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';

export function computeResourcesPermissionsForWorkspace(
  currentUser: User,
  organization: Organization,
  project: Project,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[]
): {collectionsPermissions: AllowedPermissionsMap; linkTypesPermissions: AllowedPermissionsMap} {
  const isManager = userIsManagerInWorkspace(currentUser, organization, project);
  return computeResourcesPermissions(currentUser, currentView, collections, linkTypes, isManager);
}

export function computeResourcesPermissions(
  currentUser: User,
  currentView: View,
  collections: Collection[],
  linkTypes: LinkType[],
  isManager?: boolean
): {collectionsPermissions: AllowedPermissionsMap; linkTypesPermissions: AllowedPermissionsMap} {
  const collectionsPermissions = (collections || []).reduce((map, collection) => {
    if (isManager) {
      return {...map, [collection.id]: managePermissions()};
    } else if (currentView) {
      const collectionIdsInView = getAllCollectionIdsFromQuery(currentView.query, linkTypes);
      const collectionPermissions = userPermissionsInResource(currentUser, collection);

      const viewAllowedPermissions = collectionIdsInView.includes(collection.id)
        ? userPermissionsInCollectionByView(currentUser, currentView, collection)
        : {};

      return {
        ...map,
        [collection.id]: {
          ...collectionPermissions,
          readWithView: viewAllowedPermissions.readWithView || collectionPermissions.read,
          writeWithView: viewAllowedPermissions.writeWithView || collectionPermissions.write,
          manageWithView: viewAllowedPermissions.manageWithView || collectionPermissions.manage,
        },
      };
    } else {
      return {...map, [collection.id]: userPermissionsInResource(currentUser, collection)};
    }
  }, {});

  const linkTypesPermissions = (linkTypes || []).reduce(
    (map, linkType) => ({
      ...map,
      [linkType.id]: mergeAllowedPermissions(
        collectionsPermissions[linkType.collectionIds?.[0]],
        collectionsPermissions[linkType.collectionIds?.[1]]
      ),
    }),
    {}
  );
  return {collectionsPermissions, linkTypesPermissions};
}
