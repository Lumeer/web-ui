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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {selectQuery} from '../navigation/navigation.state';
import {QueryModel} from '../navigation/query.model';
import {DocumentModel} from './document.model';
import {sortDocumentsByCreationDate} from './document.utils';
import {filterDocumentsByQuery} from './documents.filters';
import {areQueriesEqualExceptPagination} from '../navigation/query.helper';
import {selectAllCollections, selectCollectionsDictionary} from '../collections/collections.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {selectCurrentView} from '../views/views.state';
import {getCollectionsIdsFromDocuments, getCollectionsIdsFromView} from '../collections/collection.util';
import {selectCurrentUser} from '../users/users.state';
import {userHasRoleInResource} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {filterCollectionsByQuery} from '../collections/collections.filters';

export interface DocumentsState extends EntityState<DocumentModel> {
  queries: QueryModel[];
}

export const documentsAdapter = createEntityAdapter<DocumentModel>({selectId: document => document.id});

export const initialDocumentsState: DocumentsState = documentsAdapter.getInitialState({
  queries: []
});

export const selectDocumentsState = (state: AppState) => state.documents;

export const selectAllDocuments = createSelector(selectDocumentsState, documentsAdapter.getSelectors().selectAll);
export const selectDocumentsDictionary = createSelector(selectDocumentsState, documentsAdapter.getSelectors().selectEntities);
export const selectDocumentsQueries = createSelector(selectDocumentsState, documentsState => documentsState.queries);
export const selectDocumentsByQuery = createSelector(selectAllDocuments, selectQuery,
  (documents, query): DocumentModel[] => filterDocumentsByQuery(sortDocumentsByCreationDate(documents), query)
);

export const selectCurrentQueryDocumentsLoaded = createSelector(selectDocumentsQueries, selectQuery, (queries, currentQuery) =>
  !!queries.find(query => areQueriesEqualExceptPagination(query, currentQuery))
);

const selectDocumentsByReadPermission = createSelector(selectAllDocuments, selectCollectionsDictionary, selectAllLinkTypes,
  selectCurrentView, selectCurrentUser, (documents, collectionsMap, linkTypes, view, user) => {
    const documentsCollections = getCollectionsIdsFromDocuments(documents).map(collectionId => collectionsMap[collectionId])
      .filter(collection => !!collection);
    const collectionIdsFromView = getCollectionsIdsFromView(view, linkTypes, documents);
    const allowedCollectionIds = documentsCollections.reduce((ids, collection) => {
      if (userHasRoleInResource(user, collection, Role.Read) ||
        (collectionIdsFromView && collectionIdsFromView.includes(collection.id) && userHasRoleInResource(user, view, Role.Read))) {
        ids.push(collection.id);
      }
      return ids;
    }, []);
    return documents.filter(document => allowedCollectionIds.includes(document.collectionId));
  });

export const selectDocumentsByCustomQuery = (query: QueryModel, desc?: boolean) => createSelector(selectDocumentsByReadPermission,
  (documents): DocumentModel[] => filterDocumentsByQuery(sortDocumentsByCreationDate(documents, desc), query)
);

export const selectDocumentById = (id: string) => createSelector(selectDocumentsDictionary, documentsMap => documentsMap[id]);

export const selectDocumentsByIds = (ids: string[]) => createSelector(selectDocumentsDictionary,
  documentsMap => ids.map(id => documentsMap[id]).filter(doc => doc));

export const selectCollectionsByQuery = createSelector(selectAllCollections, selectAllDocuments, selectQuery,
  (collections, documents, query) => filterCollectionsByQuery(collections, documents, query));
