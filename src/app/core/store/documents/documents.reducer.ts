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

import {DocumentsAction, DocumentsActionType} from './documents.action';
import {documentsAdapter, DocumentsState, initialDocumentsState} from './documents.state';

export function documentsReducer(
  state: DocumentsState = initialDocumentsState,
  action: DocumentsAction.All
): DocumentsState {
  switch (action.type) {
    case DocumentsActionType.GET_SUCCESS:
      const queriesState = {...state, queries: state.queries.concat(action.payload.query)};
      return documentsAdapter.addMany(action.payload.documents, queriesState);
    case DocumentsActionType.CREATE_SUCCESS:
      return documentsAdapter.addOne(action.payload.document, state);
    case DocumentsActionType.UPDATE_SUCCESS:
      return documentsAdapter.updateOne({id: action.payload.document.id, changes: action.payload.document}, state);
    case DocumentsActionType.DELETE_SUCCESS:
      return documentsAdapter.removeOne(action.payload.documentId, state);
    case DocumentsActionType.ADD_FAVORITE_SUCCESS:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: true}}, state);
    case DocumentsActionType.REMOVE_FAVORITE_SUCCESS:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: false}}, state);
    case DocumentsActionType.ADD_FAVORITE_FAILURE:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: false}}, state);
    case DocumentsActionType.REMOVE_FAVORITE_FAILURE:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: true}}, state);
    case DocumentsActionType.CLEAR_BY_COLLECTION:
      return documentsAdapter.removeMany(findCollectionDocumentIds(state, action.payload.collectionId), state);
    case DocumentsActionType.CLEAR:
      return initialDocumentsState;
    default:
      return state;
  }
}

function findCollectionDocumentIds(state: DocumentsState, collectionId: string): string[] {
  return Object.values(state.entities)
    .filter(document => document.collectionId === collectionId)
    .map(document => document.id);
}
