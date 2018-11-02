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
import {authorHasRoleInView, userHasRoleInResource} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {getCollectionsIdsFromView} from '../collections/collection.util';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {selectAllCollections} from '../collections/collections.state';
import {DocumentModel} from '../documents/document.model';
import {sortDocumentsByCreationDate} from '../documents/document.utils';
import {filterDocumentsByQuery} from '../documents/documents.filters';
import {selectAllDocuments} from '../documents/documents.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {selectQuery} from '../navigation/navigation.state';
import {QueryModel} from '../navigation/query.model';
import {selectCurrentUser} from '../users/users.state';
import {selectCurrentView} from '../views/views.state';

export const selectCollectionsByReadPermission = createSelector(selectAllDocuments, selectAllCollections, selectAllLinkTypes,
  selectCurrentView, selectCurrentUser, (documents, collections, linkTypes, view, user) => {
    const collectionIdsFromView = getCollectionsIdsFromView(view, linkTypes, documents);
    return collections.filter(collection => userHasRoleInResource(user, collection, Role.Read)
      || (collectionIdsFromView && collectionIdsFromView.includes(collection.id)
        && userHasRoleInResource(user, view, Role.Read) && authorHasRoleInView(view, collection.id, Role.Read)));
  });

export const selectCollectionsByQuery = createSelector(selectCollectionsByReadPermission, selectAllDocuments, selectQuery,
  (collections, documents, query) => filterCollectionsByQuery(collections, documents, query));

export const selectDocumentsByReadPermission = createSelector(selectAllDocuments, selectCollectionsByReadPermission, (documents, collections) => {
  const allowedCollectionIds = collections.map(collection => collection.id);
  return documents.filter(document => allowedCollectionIds.includes(document.collectionId));
});

export const selectDocumentsByQuery = createSelector(
  selectDocumentsByReadPermission, selectQuery, selectCurrentUser,
  (documents, query, currentUser): DocumentModel[] => filterDocumentsByQuery(sortDocumentsByCreationDate(documents), query, currentUser)
);

export const selectDocumentsByCustomQuery = (query: QueryModel, desc?: boolean, includeChildren?: boolean) => createSelector(
  selectDocumentsByReadPermission, selectCurrentUser,
  (documents, currentUser) => filterDocumentsByQuery(sortDocumentsByCreationDate(documents, desc), query, currentUser, includeChildren)
);

export const selectLinkTypesByReadPermission = createSelector(selectAllLinkTypes, selectCollectionsByReadPermission, (linkTypes, collections) => {
  const allowedCollectionIds = collections.map(collection => collection.id);
  return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
});

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(selectLinkTypesByReadPermission, linkTypes => linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId)));
