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

import {Action} from '@ngrx/store';
import {DocumentMetaData, DocumentModel} from './document.model';
import {Query} from '../navigation/query';

export enum DocumentsActionType {
  GET = '[Documents] Get',
  GET_SUCCESS = '[Documents] Get :: Success',
  GET_FAILURE = '[Documents] Get :: Failure',

  CREATE = '[Documents] Create',
  CREATE_SUCCESS = '[Documents] Create :: Success',
  CREATE_FAILURE = '[Documents] Create :: Failure',

  PATCH = '[Documents] Patch Document',

  UPDATE_SUCCESS = '[Documents] Update :: Success',
  UPDATE_FAILURE = '[Documents] Update :: Failure',

  UPDATE_DATA = '[Documents] Update Data',
  PATCH_DATA = '[Documents] Patch Data',

  UPDATE_META_DATA = '[Documents] Update Meta Data',
  PATCH_META_DATA = '[Documents] Patch Meta Data',

  ADD_FAVORITE = '[Documents] Add Favorite',
  ADD_FAVORITE_SUCCESS = '[Documents] Add Favorite :: Success',
  ADD_FAVORITE_FAILURE = '[Documents] Add Favorite :: Failure',

  REMOVE_FAVORITE = '[Documents] Remove Favorite',
  REMOVE_FAVORITE_SUCCESS = '[Documents] Remove Favorite :: Success',
  REMOVE_FAVORITE_FAILURE = '[Documents] Remove Favorite :: Failure',

  DELETE = '[Documents] Delete',
  DELETE_CONFIRM = '[Documents] Delete :: Confirm',
  DELETE_SUCCESS = '[Documents] Delete :: Success',
  DELETE_FAILURE = '[Documents] Delete :: Failure',

  CLEAR = '[Documents] Clear',
  CLEAR_BY_COLLECTION = '[Documents] Clear by collection',
}

export namespace DocumentsAction {
  export class Get implements Action {
    public readonly type = DocumentsActionType.GET;

    public constructor(public payload: {query: Query}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = DocumentsActionType.GET_SUCCESS;

    public constructor(public payload: {documents: DocumentModel[]; query: Query}) {}
  }

  export class GetFailure implements Action {
    public readonly type = DocumentsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = DocumentsActionType.CREATE;

    public constructor(public payload: {document: DocumentModel; callback?: (documentId: string) => void}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = DocumentsActionType.CREATE_SUCCESS;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = DocumentsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Patch implements Action {
    public readonly type = DocumentsActionType.PATCH;

    public constructor(public payload: {collectionId: string; documentId: string; document: Partial<DocumentModel>}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = DocumentsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = DocumentsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class UpdateData implements Action {
    public readonly type = DocumentsActionType.UPDATE_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class PatchData implements Action {
    public readonly type = DocumentsActionType.PATCH_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class UpdateMetaData implements Action {
    public readonly type = DocumentsActionType.UPDATE_META_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class PatchMetaData implements Action {
    public readonly type = DocumentsActionType.PATCH_META_DATA;

    public constructor(
      public payload: {
        collectionId: string;
        documentId: string;
        metaData: DocumentMetaData;
        onSuccess?: (document: DocumentModel) => void;
      }
    ) {}
  }

  export class Delete implements Action {
    public readonly type = DocumentsActionType.DELETE;

    public constructor(public payload: {collectionId: string; documentId: string; nextAction?: Action}) {}
  }

  export class DeleteConfirm implements Action {
    public readonly type = DocumentsActionType.DELETE_CONFIRM;

    public constructor(public payload: {collectionId: string; documentId: string; nextAction?: Action}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = DocumentsActionType.DELETE_SUCCESS;

    public constructor(public payload: {documentId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = DocumentsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class AddFavorite implements Action {
    public readonly type = DocumentsActionType.ADD_FAVORITE;

    public constructor(public payload: {collectionId: string; documentId: string}) {}
  }

  export class AddFavoriteSuccess implements Action {
    public readonly type = DocumentsActionType.ADD_FAVORITE_SUCCESS;

    public constructor(public payload: {documentId: string}) {}
  }

  export class AddFavoriteFailure implements Action {
    public readonly type = DocumentsActionType.ADD_FAVORITE_FAILURE;

    public constructor(public payload: {documentId: string; error: any}) {}
  }

  export class RemoveFavorite implements Action {
    public readonly type = DocumentsActionType.REMOVE_FAVORITE;

    public constructor(public payload: {collectionId: string; documentId: string}) {}
  }

  export class RemoveFavoriteSuccess implements Action {
    public readonly type = DocumentsActionType.REMOVE_FAVORITE_SUCCESS;

    public constructor(public payload: {documentId: string}) {}
  }

  export class RemoveFavoriteFailure implements Action {
    public readonly type = DocumentsActionType.REMOVE_FAVORITE_FAILURE;

    public constructor(public payload: {documentId: string; error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = DocumentsActionType.CLEAR;
  }

  export class ClearByCollection implements Action {
    public readonly type = DocumentsActionType.CLEAR_BY_COLLECTION;

    public constructor(public payload: {collectionId: string}) {}
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | Patch
    | AddFavorite
    | AddFavoriteSuccess
    | AddFavoriteFailure
    | RemoveFavorite
    | RemoveFavoriteSuccess
    | RemoveFavoriteFailure
    | UpdateData
    | PatchData
    | UpdateMetaData
    | PatchMetaData
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | DeleteConfirm
    | Clear
    | ClearByCollection;
}
