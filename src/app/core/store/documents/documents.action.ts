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

import {Action} from '@ngrx/store';
import {Workspace} from '../navigation/workspace';
import {DocumentMetaData, DocumentModel} from './document.model';
import {LinkInstance} from '../link-instances/link.instance';
import {DataQuery} from '../../model/data-query';
import {DataQueryPayload} from '../utils/data-query-payload';

export enum DocumentsActionType {
  GET = '[Documents] Get',
  GET_SINGLE = '[Documents] Get Single',
  GET_SUCCESS = '[Documents] Get :: Success',
  GET_FAILURE = '[Documents] Get :: Failure',

  GET_BY_IDS = '[Documents] Get By Ids',

  CREATE = '[Documents] Create',
  CREATE_WITH_LINK = '[Documents] Create With Link',
  CREATE_SUCCESS = '[Documents] Create :: Success',
  CREATE_FAILURE = '[Documents] Create :: Failure',

  CREATE_CHAIN = '[Documents] Create Chain',
  CREATE_CHAIN_SUCCESS = '[Documents] Create Chain :: Success',

  PATCH = '[Documents] Patch Document',

  UPDATE_SUCCESS = '[Documents] Update :: Success',
  UPDATE_FAILURE = '[Documents] Update :: Failure',

  DUPLICATE = '[Documents] Duplicate',
  DUPLICATE_SUCCESS = '[Documents] Duplicate :: Success',

  UPDATE_DATA = '[Documents] Update Data',
  UPDATE_DATA_INTERNAL = '[Documents] Update Data Internal',
  PATCH_DATA = '[Documents] Patch Data',
  PATCH_DATA_INTERNAL = '[Documents] Patch Data Internal',
  PATCH_DATA_PENDING = '[Documents] Patch Data Pending',

  REVERT_DATA = '[Documents] Revert Data',

  CHECK_DATA_HINT = '[Documents] Check Data Hint',

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

  SET_LOADING_QUERY = '[Documents] Set Loading Query',

  CLEAR = '[Documents] Clear',
  CLEAR_QUERIES = '[Documents] Clear Queries',
  CLEAR_BY_COLLECTION = '[Documents] Clear by collection',

  RUN_RULE = '[Documents] Run Rule',
  RUN_RULE_FAILURE = '[Documents] Run Rule :: Failure',
}

export namespace DocumentsAction {
  export class Get implements Action {
    public readonly type = DocumentsActionType.GET;

    public constructor(public payload: DataQueryPayload) {}
  }

  export class GetSingle implements Action {
    public readonly type = DocumentsActionType.GET_SINGLE;

    public constructor(public payload: {collectionId: string; documentId: string}) {}
  }

  export class GetByIds implements Action {
    public readonly type = DocumentsActionType.GET_BY_IDS;

    public constructor(public payload: {documentsIds: string[]}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = DocumentsActionType.GET_SUCCESS;

    public constructor(public payload: {documents: DocumentModel[]; query?: DataQuery}) {}
  }

  export class GetFailure implements Action {
    public readonly type = DocumentsActionType.GET_FAILURE;

    public constructor(public payload: {error: any; query?: DataQuery}) {}
  }

  export class Create implements Action {
    public readonly type = DocumentsActionType.CREATE;

    public constructor(
      public payload: {
        document: DocumentModel;
        onSuccess?: (documentId: string) => void;
        onFailure?: () => void;
        afterSuccess?: (documentId: string) => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = DocumentsActionType.CREATE_SUCCESS;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = DocumentsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any; correlationId?: string}) {}
  }

  export class CreateWithLink implements Action {
    public readonly type = DocumentsActionType.CREATE_WITH_LINK;

    public constructor(
      public payload: {
        document: DocumentModel;
        otherDocumentId: string;
        linkInstance: LinkInstance;
        onSuccess?: ({documentId, linkInstanceId}) => void;
        onFailure?: () => void;
        afterSuccess?: ({documentId, linkInstanceId}) => void;
      }
    ) {}
  }

  export class CreateChain implements Action {
    public readonly type = DocumentsActionType.CREATE_CHAIN;

    public constructor(
      public payload: {documents: DocumentModel[]; linkInstances: LinkInstance[]; failureMessage: string}
    ) {}
  }

  export class CreateChainSuccess implements Action {
    public readonly type = DocumentsActionType.CREATE_CHAIN_SUCCESS;

    public constructor(public payload: {documents: DocumentModel[]}) {}
  }

  export class Patch implements Action {
    public readonly type = DocumentsActionType.PATCH;

    public constructor(public payload: {collectionId: string; documentId: string; document: Partial<DocumentModel>}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = DocumentsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {document: DocumentModel; originalDocument: DocumentModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = DocumentsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any; originalDocument?: DocumentModel}) {}
  }

  export class Duplicate implements Action {
    public readonly type = DocumentsActionType.DUPLICATE;

    public constructor(
      public payload: {
        collectionId: string;
        correlationId?: string;
        documentIds: string[];
        onSuccess?: (documents: DocumentModel[]) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class DuplicateSuccess implements Action {
    public readonly type = DocumentsActionType.DUPLICATE_SUCCESS;

    public constructor(public payload: {documents: DocumentModel[]}) {}
  }

  export class UpdateData implements Action {
    public readonly type = DocumentsActionType.UPDATE_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class UpdateDataInternal implements Action {
    public readonly type = DocumentsActionType.UPDATE_DATA_INTERNAL;

    public constructor(public payload: {document: DocumentModel; originalDocument?: DocumentModel}) {}
  }

  export class RevertData implements Action {
    public readonly type = DocumentsActionType.REVERT_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class PatchData implements Action {
    public readonly type = DocumentsActionType.PATCH_DATA;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  export class PatchDataInternal implements Action {
    public readonly type = DocumentsActionType.PATCH_DATA_INTERNAL;

    public constructor(public payload: {document: DocumentModel; originalDocument?: DocumentModel}) {}
  }

  export class CheckDataHint implements Action {
    public readonly type = DocumentsActionType.CHECK_DATA_HINT;

    public constructor(public payload: {document: DocumentModel}) {}
  }

  /**
   * Applies data updates that were accumulated while the document was being created.
   */
  export class PatchDataPending implements Action {
    public readonly type = DocumentsActionType.PATCH_DATA_PENDING;

    public constructor(public payload: {collectionId: string; documentId: string; correlationId: string}) {}
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

    public constructor(public payload: {collectionId: string; documentId: string; workspace?: Workspace}) {}
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

    public constructor(public payload: {collectionId: string; documentId: string; workspace?: Workspace}) {}
  }

  export class RemoveFavoriteSuccess implements Action {
    public readonly type = DocumentsActionType.REMOVE_FAVORITE_SUCCESS;

    public constructor(public payload: {documentId: string}) {}
  }

  export class RemoveFavoriteFailure implements Action {
    public readonly type = DocumentsActionType.REMOVE_FAVORITE_FAILURE;

    public constructor(public payload: {documentId: string; error: any}) {}
  }

  export class ClearQueries implements Action {
    public readonly type = DocumentsActionType.CLEAR_QUERIES;

    public constructor(public payload: {collectionId?: string}) {}
  }

  export class Clear implements Action {
    public readonly type = DocumentsActionType.CLEAR;
  }

  export class ClearByCollection implements Action {
    public readonly type = DocumentsActionType.CLEAR_BY_COLLECTION;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class SetLoadingQuery implements Action {
    public readonly type = DocumentsActionType.SET_LOADING_QUERY;

    public constructor(public payload: {query: DataQuery}) {}
  }

  export class RunRule implements Action {
    public readonly type = DocumentsActionType.RUN_RULE;

    public constructor(
      public payload: {collectionId: string; documentId: string; attributeId: string; actionName?: string}
    ) {}
  }

  export class RunRuleFailure implements Action {
    public readonly type = DocumentsActionType.RUN_RULE_FAILURE;

    public constructor(public payload: {documentId: string; attributeId: string; error: any}) {}
  }

  export type All =
    | Get
    | GetSingle
    | GetSuccess
    | GetFailure
    | Create
    | CreateWithLink
    | CreateSuccess
    | CreateFailure
    | CreateChain
    | CreateChainSuccess
    | Patch
    | AddFavorite
    | AddFavoriteSuccess
    | AddFavoriteFailure
    | RemoveFavorite
    | RemoveFavoriteSuccess
    | RemoveFavoriteFailure
    | Duplicate
    | DuplicateSuccess
    | UpdateData
    | UpdateDataInternal
    | RevertData
    | PatchData
    | PatchDataInternal
    | PatchDataPending
    | CheckDataHint
    | UpdateMetaData
    | PatchMetaData
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | DeleteConfirm
    | Clear
    | ClearQueries
    | ClearByCollection
    | SetLoadingQuery
    | RunRule
    | RunRuleFailure;
}
