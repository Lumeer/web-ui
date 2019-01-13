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
import {createSelector} from '@ngrx/store';
import {isArraySubset} from '../../../shared/utils/array.utils';
import {
  authorHasRoleInView,
  userHasRoleInResource,
  userIsManagerInWorkspace,
} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {selectAllCollections} from '../collections/collections.state';
import {DocumentModel} from '../documents/document.model';
import {sortDocumentsByCreationDate} from '../documents/document.utils';
import {filterDocumentsByQuery} from '../documents/documents.filters';
import {selectAllDocuments} from '../documents/documents.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {selectQuery} from '../navigation/navigation.state';
import {selectCurrentUser} from '../users/users.state';
import {selectAllViews, selectCurrentView} from '../views/views.state';
import {getAllCollectionIdsFromQuery} from '../navigation/query.util';
import {selectAllLinkInstances} from '../link-instances/link-instances.state';
import {Query} from '../navigation/query';
import {selectWorkspaceModels} from './common.selectors';
import {View} from '../views/view';
import {filterViewsByQuery, sortViewsById} from '../views/view.filters';

export const selectCurrentUserIsManager = createSelector(
  selectCurrentUser,
  selectWorkspaceModels,
  (user, workspace) => {
    const {organization, project} = workspace;
    return userIsManagerInWorkspace(user, organization, project);
  }
);

export const selectCollectionsByReadPermission = createSelector(
  selectCurrentUserIsManager,
  selectAllCollections,
  selectAllLinkTypes,
  selectCurrentView,
  selectCurrentUser,
  (isManager, collections, linkTypes, view, user) => {
    if (isManager) {
      return collections;
    }
    const collectionIdsFromView = view && getAllCollectionIdsFromQuery(view.query, linkTypes);
    return collections.filter(
      collection =>
        userHasRoleInResource(user, collection, Role.Read) ||
        (collectionIdsFromView &&
          collectionIdsFromView.includes(collection.id) &&
          userHasRoleInResource(user, view, Role.Read) &&
          authorHasRoleInView(view, collection.id, Role.Read))
    );
  }
);

export const selectCollectionsByQuery = createSelector(
  selectCollectionsByReadPermission,
  selectAllDocuments,
  selectAllLinkTypes,
  selectQuery,
  (collections, documents, linkTypes, query) => filterCollectionsByQuery(collections, documents, linkTypes, query)
);

export const selectDocumentsByReadPermission = createSelector(
  selectAllDocuments,
  selectCollectionsByReadPermission,
  (documents, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return documents.filter(document => allowedCollectionIds.includes(document.collectionId));
  }
);

export const selectDocumentsByQuery = createSelector(
  selectDocumentsByReadPermission,
  selectCollectionsByReadPermission,
  selectAllLinkTypes,
  selectAllLinkInstances,
  selectQuery,
  selectCurrentUser,
  (documents, collections, linkTypes, linkInstances, query, currentUser): DocumentModel[] =>
    sortDocumentsByCreationDate(
      filterDocumentsByQuery(documents, collections, linkTypes, linkInstances, query, currentUser)
    )
);

export const selectDocumentsByCustomQuery = (query: Query, desc?: boolean, includeChildren?: boolean) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectCollectionsByReadPermission,
    selectAllLinkTypes,
    selectAllLinkInstances,
    selectCurrentUser,
    (documents, collections, linkTypes, linkInstances, currentUser) =>
      sortDocumentsByCreationDate(
        filterDocumentsByQuery(documents, collections, linkTypes, linkInstances, query, currentUser, includeChildren),
        desc
      )
  );

export const selectLinkTypesByReadPermission = createSelector(
  selectAllLinkTypes,
  selectCollectionsByReadPermission,
  (linkTypes, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
  }
);

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(
    selectLinkTypesByReadPermission,
    linkTypes => linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId))
  );

export const selectViewsByRead = createSelector(
  selectAllViews,
  selectCurrentUser,
  selectCurrentUserIsManager,
  (views, user, isManager) => (isManager && views) || views.filter(view => userHasRoleInResource(user, view, Role.Read))
);

export const selectViewsByQuery = createSelector(
  selectViewsByRead,
  selectQuery,
  (views, query): View[] => sortViewsById(filterViewsByQuery(views, query))
);
