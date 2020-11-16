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

import {DocumentModel} from './document.model';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {documentsAdapter, DocumentsState, initialDocumentsState} from './documents.state';
import {getBaseCollectionIdsFromQuery} from '../navigation/query/query.util';

export function documentsReducer(
  state: DocumentsState = initialDocumentsState,
  action: DocumentsAction.All
): DocumentsState {
  switch (action.type) {
    case DocumentsActionType.GET_SUCCESS:
      return addDocuments(state, action);
    case DocumentsActionType.CREATE:
      return onCreateDocument(state, action);
    case DocumentsActionType.CREATE_SUCCESS:
      return addOrUpdateDocument(state, action.payload.document);
    case DocumentsActionType.CREATE_FAILURE:
      return onCreateDocumentFailure(state, action);
    case DocumentsActionType.UPDATE_DATA_INTERNAL:
      return updateDocument(state, action);
    case DocumentsActionType.PATCH_DATA:
      return onPatchData(state, action);
    case DocumentsActionType.PATCH_DATA_INTERNAL:
      return patchData(state, action);
    case DocumentsActionType.PATCH_DATA_PENDING:
      return removeEmptyPendingData(state, action);
    case DocumentsActionType.CREATE_CHAIN_SUCCESS:
      return documentsAdapter.upsertMany(action.payload.documents, state);
    case DocumentsActionType.UPDATE_SUCCESS:
      return addOrUpdateDocument(state, action.payload.document);
    case DocumentsActionType.UPDATE_FAILURE:
      return revertDocument(state, action.payload.originalDocument);
    case DocumentsActionType.DELETE_SUCCESS:
      return documentsAdapter.removeOne(action.payload.documentId, state);
    case DocumentsActionType.DUPLICATE_SUCCESS:
      return documentsAdapter.upsertMany(action.payload.documents, state);
    case DocumentsActionType.ADD_FAVORITE_SUCCESS:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: true}}, state);
    case DocumentsActionType.REMOVE_FAVORITE_SUCCESS:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: false}}, state);
    case DocumentsActionType.ADD_FAVORITE_FAILURE:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: false}}, state);
    case DocumentsActionType.REMOVE_FAVORITE_FAILURE:
      return documentsAdapter.updateOne({id: action.payload.documentId, changes: {favorite: true}}, state);
    case DocumentsActionType.CLEAR_BY_COLLECTION:
      return clearDocumentsAndQueries(action.payload.collectionId, state);
    case DocumentsActionType.CLEAR:
      return initialDocumentsState;
    default:
      return state;
  }
}

function clearDocumentsAndQueries(collectionId: string, state: DocumentsState): DocumentsState {
  const queries = [...state.queries].filter(query => !getBaseCollectionIdsFromQuery(query).includes(collectionId));
  return documentsAdapter.removeMany(document => document.collectionId === collectionId, {...state, queries});
}

function onCreateDocument(state: DocumentsState, action: DocumentsAction.Create): DocumentsState {
  const {correlationId, data} = action.payload.document;
  if (!correlationId) {
    return state;
  }

  const pendingDocumentData = state.pendingDataUpdates[correlationId];
  const pendingDataUpdates = {
    ...state.pendingDataUpdates,
    [correlationId]: pendingDocumentData ? {...pendingDocumentData, ...data} : {},
  };
  return {...state, pendingDataUpdates};
}

function onCreateDocumentFailure(state: DocumentsState, action: DocumentsAction.CreateFailure): DocumentsState {
  const {correlationId} = action.payload;
  if (!correlationId) {
    return state;
  }
  const pendingDataUpdates = {...state.pendingDataUpdates};
  delete pendingDataUpdates[correlationId];
  return {...state, pendingDataUpdates};
}

function onPatchData(state: DocumentsState, action: DocumentsAction.PatchData): DocumentsState {
  const {correlationId} = action.payload.document;
  const {[correlationId]: _, ...pendingDataUpdates} = state.pendingDataUpdates;
  return correlationId ? {...state, pendingDataUpdates} : state;
}

function removeEmptyPendingData(state: DocumentsState, action: DocumentsAction.PatchDataPending): DocumentsState {
  const {correlationId} = action.payload;
  const data = state.pendingDataUpdates[correlationId];

  if (data && Object.keys(data).length === 0) {
    const {[correlationId]: _, ...pendingDataUpdates} = state.pendingDataUpdates;
    return {...state, pendingDataUpdates};
  }

  return state;
}

function patchData(state: DocumentsState, action: DocumentsAction.PatchDataInternal): DocumentsState {
  const originalDocument = action.payload.originalDocument;

  return documentsAdapter.upsertOne(
    {
      ...action.payload.document,
      data: {
        ...originalDocument.data,
        ...action.payload.document.data,
      },
      dataVersion: originalDocument.dataVersion + 1,
    },
    state
  );
}

function updateDocument(state: DocumentsState, action: DocumentsAction.UpdateDataInternal): DocumentsState {
  return documentsAdapter.upsertOne(
    {
      ...action.payload.document,
      dataVersion: action.payload.document.dataVersion + 1,
    },
    state
  );
}

function addDocuments(state: DocumentsState, action: DocumentsAction.GetSuccess): DocumentsState {
  const queriesState = {
    ...state,
    queries: action.payload.query ? state.queries.concat(action.payload.query) : state.queries,
  };

  const filteredDocuments = action.payload.documents.filter(document => {
    const oldDocument = state.entities[document.id];
    return !oldDocument || isDocumentNewer(document, oldDocument);
  });

  return documentsAdapter.upsertMany(filteredDocuments, queriesState);
}

function addOrUpdateDocument(state: DocumentsState, document: DocumentModel): DocumentsState {
  const oldDocument = state.entities[document.id];
  if (!oldDocument) {
    return documentsAdapter.addOne(document, state);
  }

  if (isDocumentNewer(document, oldDocument)) {
    return documentsAdapter.upsertOne(document, state);
  } else if (isModifiedLater(document, oldDocument)) {
    return documentsAdapter.updateOne(
      {
        id: document.id,
        changes: {updateDate: document.updateDate, updatedBy: document.updatedBy},
      },
      state
    );
  }
  return state;
}

function revertDocument(state: DocumentsState, originalDocument: DocumentModel): DocumentsState {
  if (originalDocument) {
    const storedDocument = state.entities[originalDocument.id];

    if (!storedDocument) {
      return documentsAdapter.addOne(originalDocument, state);
    }

    return documentsAdapter.upsertOne(originalDocument, state);
  }

  return state;
}

function isDocumentNewer(document: DocumentModel, oldDocument: DocumentModel): boolean {
  return document.dataVersion && (!oldDocument.dataVersion || document.dataVersion > oldDocument.dataVersion);
}

function isModifiedLater(document: DocumentModel, oldDocument: DocumentModel): boolean {
  return (
    document.updateDate && (!oldDocument.updateDate || document.updateDate.getTime() > oldDocument.updateDate.getTime())
  );
}
