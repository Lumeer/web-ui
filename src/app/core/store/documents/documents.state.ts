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
import {isNullOrUndefined} from 'util';
import {AppState} from '../app.state';
import {selectCollectionsDictionary} from '../collections/collections.state';
import {selectQuery} from '../navigation/navigation.state';
import {QueryModel} from '../navigation/query.model';

import {DocumentModel} from './document.model';

export interface DocumentsState extends EntityState<DocumentModel> {
  queries: QueryModel[];
}

export const documentsAdapter = createEntityAdapter<DocumentModel>();

export const initialDocumentsState: DocumentsState = documentsAdapter.getInitialState({
  queries: []
});

export const selectDocumentsState = (state: AppState) => state.documents;

export const selectAllDocuments = createSelector(selectDocumentsState, documentsAdapter.getSelectors().selectAll);
export const selectDocumentsDictionary = createSelector(selectDocumentsState, documentsAdapter.getSelectors().selectEntities);
export const selectDocumentsQueries = createSelector(selectDocumentsState, documentsState => documentsState.queries);
export const selectDocumentsByQuery = createSelector(
  selectAllDocuments,
  selectCollectionsDictionary,
  selectQuery,
  (documents, collections, query): DocumentModel[] => {
    // TODO create more complex filtering
    documents = filterDocumentsByQuery(documents, query);

    return documents.map(document => {
      return {...document, collection: collections[document.collectionCode]};
    });
  }
);

export function selectDocumentsByCustomQuery(query: QueryModel) {
  return createSelector(
    selectAllDocuments,
    selectCollectionsDictionary,
    (documents, collections): DocumentModel[] => {
      documents = filterDocumentsByQuery(documents, query);

      return documents.map(document => {
        return {...document, collection: collections[document.collectionCode]};
      });
    }
  );
}

const filterDocumentsByQuery = (documents: DocumentModel[], query: QueryModel): DocumentModel[] => {
  if (query.collectionCodes && query.collectionCodes.length) {
    documents = documents.filter(document => query.collectionCodes.includes(document.collectionCode));
  }

  if (!isNullOrUndefined(query.page) && !isNullOrUndefined(query.pageSize)) {
    documents = documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
  }

  return documents;
};
