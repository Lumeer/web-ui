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
import {QueryModel} from '../navigation/query.model';
import {DocumentModel} from './document.model';

export enum DocumentsActionType {

  GET = '[Documents] Get',
  GET_SUCCESS = '[Documents] Get :: Success',
  GET_FAILURE = '[Documents] Get :: Failure',

  CREATE = '[Documents] Create',
  CREATE_SUCCESS = '[Documents] Create :: Success',
  CREATE_FAILURE = '[Documents] Create :: Failure',

  UPDATE = '[Documents] Update',
  UPDATE_SUCCESS = '[Documents] Update :: Success',
  UPDATE_FAILURE = '[Documents] Update :: Failure',

  UPDATE_DATA = '[Documents] Update Data',
  PATCH_DATA = '[Documents] Patch Data',

  DELETE = '[Documents] Delete',
  DELETE_CONFIRM = '[Documents] Delete :: Confirm',
  DELETE_SUCCESS = '[Documents] Delete :: Success',
  DELETE_FAILURE = '[Documents] Delete :: Failure',

  CLEAR = '[Documents] Clear'

}

export namespace DocumentsAction {

  export class Get implements Action {
    public readonly type = DocumentsActionType.GET;

    public constructor(public payload: { query: QueryModel }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = DocumentsActionType.GET_SUCCESS;

    public constructor(public payload: { documents: DocumentModel[] }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = DocumentsActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = DocumentsActionType.CREATE;

    public constructor(public payload: { document: DocumentModel, callback?: (documentId: string) => void }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = DocumentsActionType.CREATE_SUCCESS;

    public constructor(public payload: { document: DocumentModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = DocumentsActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = DocumentsActionType.UPDATE;

    public constructor(public payload: { document: DocumentModel, toggleFavourite: boolean }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = DocumentsActionType.UPDATE_SUCCESS;

    public constructor(public payload: { document: DocumentModel }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = DocumentsActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class UpdateData implements Action {
    public readonly type = DocumentsActionType.UPDATE_DATA;

    public constructor(public payload: { collectionId: string, documentId: string, data: any }) {
    }
  }

  export class PatchData implements Action {
    public readonly type = DocumentsActionType.PATCH_DATA;

    public constructor(public payload: { collectionId: string, documentId: string, data: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = DocumentsActionType.DELETE;

    public constructor(public payload: { collectionId: string, documentId: string, nextAction?: Action }) {
    }
  }

  export class DeleteConfirm implements Action {
    public readonly type = DocumentsActionType.DELETE_CONFIRM;

    public constructor(public payload: { collectionId: string, documentId: string, nextAction?: Action }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = DocumentsActionType.DELETE_SUCCESS;

    public constructor(public payload: { documentId: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = DocumentsActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Clear implements Action {
    public readonly type = DocumentsActionType.CLEAR;

    public constructor() {
    }
  }

  export type All =
    Get | GetSuccess | GetFailure |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateData | PatchData | UpdateSuccess | UpdateFailure |
    Delete | DeleteSuccess | DeleteFailure | DeleteConfirm |
    Clear;
}
