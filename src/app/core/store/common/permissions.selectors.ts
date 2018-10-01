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
import {selectAllCollections} from '../collections/collections.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {selectCurrentView} from '../views/views.state';
import {selectCurrentUser} from '../users/users.state';
import {getCollectionsIdsFromView} from '../collections/collection.util';
import {userHasRoleInResource} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {selectAllDocuments} from '../documents/documents.state';
import {selectQuery} from '../navigation/navigation.state';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {DocumentModel} from '../documents/document.model';
import {filterDocumentsByQuery} from '../documents/documents.filters';
import {sortDocumentsByCreationDate} from '../documents/document.utils';
import {QueryModel} from '../navigation/query.model';
import {isArraySubset} from '../../../shared/utils/array.utils';

export const selectCollectionsByReadPermission = createSelector(selectAllDocuments, selectAllCollections, selectAllLinkTypes,
  selectCurrentView, selectCurrentUser, (documents, collections, linkTypes, view, user) => {
    const collectionIdsFromView = getCollectionsIdsFromView(view, linkTypes, documents);
    return collections.filter(collection => userHasRoleInResource(user, collection, Role.Read)
      || (collectionIdsFromView && collectionIdsFromView.includes(collection.id) && userHasRoleInResource(user, view, Role.Read)));
  }); // TODO check collection role for author of view

export const selectCollectionsByQuery = createSelector(selectCollectionsByReadPermission, selectAllDocuments, selectQuery,
  (collections, documents, query) => filterCollectionsByQuery(collections, documents, query));

export const selectDocumentsByReadPermission = createSelector(selectAllDocuments, selectCollectionsByReadPermission, (documents, collections) => {
  const allowedCollectionIds = collections.map(collection => collection.id);
  return documents.filter(document => allowedCollectionIds.includes(document.collectionId));
});

export const selectDocumentsByQuery = createSelector(selectDocumentsByReadPermission, selectQuery,
  (documents, query): DocumentModel[] => filterDocumentsByQuery(sortDocumentsByCreationDate(documents), query)
);

export const selectDocumentsByCustomQuery = (query: QueryModel, desc?: boolean) => createSelector(selectDocumentsByReadPermission,
  (documents): DocumentModel[] => filterDocumentsByQuery(sortDocumentsByCreationDate(documents, desc), query)
);

export const selectLinkTypesByReadPermission = createSelector(selectAllLinkTypes, selectCollectionsByReadPermission, (linkTypes, collections) => {
  const allowedCollectionIds = collections.map(collection => collection.id);
  return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
});

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(selectLinkTypesByReadPermission, linkTypes => linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId)));
