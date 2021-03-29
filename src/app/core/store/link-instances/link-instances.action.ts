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
import {LinkInstance} from './link.instance';
import {DataQuery} from '../../model/data-query';
import {DataQueryPayload} from '../utils/data-query-payload';

export enum LinkInstancesActionType {
  GET = '[Link Instances] Get',
  GET_SINGLE = '[Link Instances] Get Single',
  GET_SUCCESS = '[Link Instances] Get :: Success',
  GET_FAILURE = '[Link Instances] Get :: Failure',

  GET_BY_IDS = '[Link Instances] Get By Ids',

  CREATE = '[Link Instances] Create',
  CREATE_SUCCESS = '[Link Instances] Create :: Success',
  CREATE_MULTIPLE_SUCCESS = '[Link Instances] Create Multiple :: Success',
  CREATE_FAILURE = '[Link Instances] Create :: Failure',

  SET_DOCUMENT_LINKS = '[Link Instances] Set Document Links',
  SET_DOCUMENT_LINKS_SUCCESS = '[Link Instances] Set Document Links :: Success',
  SET_DOCUMENT_LINKS_FAILURE = '[Link Instances] Set Document Links :: Failure',

  UPDATE = '[Link Instances] Update',
  UPDATE_INTERNAL = '[Link Instances] Update :: Internal',

  UPDATE_DATA = '[Link Instances] Update Data',
  UPDATE_DATA_INTERNAL = '[Link Instances] Update Data Internal',
  PATCH_DATA = '[Link Instances] Patch Data',
  PATCH_DATA_INTERNAL = '[Link Instances] Patch Data :: Internal',

  REVERT_DATA = '[Link Instances] Revert Data',

  UPDATE_SUCCESS = '[Link Instances] Update :: Success',
  UPDATE_FAILURE = '[Link Instances] Update :: Failure',

  CHANGE_DOCUMENTS = '[Link Instances] Change Documents',

  DELETE = '[Link Instances] Delete',
  DELETE_CONFIRM = '[Link Instances] Delete :: Confirm',
  DELETE_SUCCESS = '[Link Instances] Delete :: Success',
  DELETE_FAILURE = '[Link Instances] Delete :: Failure',

  DUPLICATE = '[Link Instances] Duplicate',
  DUPLICATE_SUCCESS = '[Link Instances] Duplicate :: Success',

  CLEAR = '[Link Instances] Clear',
  CLEAR_QUERIES = '[Link Instances] Clear Queries',
  CLEAR_BY_LINK_TYPE = '[Link Instances] Clear By Link Type',

  SET_LOADING_QUERY = '[Link Instances] Set Loading Query',

  RUN_RULE = '[Link Instances] Run Rule',
  RUN_RULE_FAILURE = '[Link Instances] Run Rule :: Failure',
}

export namespace LinkInstancesAction {
  export class Get implements Action {
    public readonly type = LinkInstancesActionType.GET;

    public constructor(public payload: DataQueryPayload) {}
  }

  export class GetSingle implements Action {
    public readonly type = LinkInstancesActionType.GET_SINGLE;

    public constructor(public payload: {linkTypeId: string; linkInstanceId: string}) {}
  }

  export class GetByIds implements Action {
    public readonly type = LinkInstancesActionType.GET_BY_IDS;

    public constructor(public payload: {linkInstancesIds: string[]}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = LinkInstancesActionType.GET_SUCCESS;

    public constructor(public payload: {linkInstances: LinkInstance[]; query?: DataQuery}) {}
  }

  export class GetFailure implements Action {
    public readonly type = LinkInstancesActionType.GET_FAILURE;

    public constructor(public payload: {error: any; query?: DataQuery}) {}
  }

  export class Create implements Action {
    public readonly type = LinkInstancesActionType.CREATE;

    public constructor(
      public payload: {
        linkInstance: LinkInstance;
        onSuccess?: (linkInstanceId: string) => void;
        onFailure?: () => void;
        afterSuccess?: (linkInstanceId: string) => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = LinkInstancesActionType.CREATE_SUCCESS;

    public constructor(public payload: {linkInstance: LinkInstance}) {}
  }

  export class CreateMultipleSuccess implements Action {
    public readonly type = LinkInstancesActionType.CREATE_MULTIPLE_SUCCESS;

    public constructor(public payload: {linkInstances: LinkInstance[]}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = LinkInstancesActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class RevertData implements Action {
    public readonly type = LinkInstancesActionType.REVERT_DATA;

    public constructor(public payload: {linkInstance: LinkInstance}) {}
  }

  export class PatchData implements Action {
    public readonly type = LinkInstancesActionType.PATCH_DATA;

    public constructor(public payload: {linkInstance: LinkInstance}) {}
  }

  export class PatchDataInternal implements Action {
    public readonly type = LinkInstancesActionType.PATCH_DATA_INTERNAL;

    public constructor(public payload: {linkInstanceId: string; data: Record<string, any>}) {}
  }

  export class UpdateData implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_DATA;

    public constructor(public payload: {linkInstance: LinkInstance}) {}
  }

  export class UpdateDataInternal implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_DATA_INTERNAL;

    public constructor(public payload: {linkInstance: LinkInstance; originalLinkInstance?: LinkInstance}) {}
  }

  export class Update implements Action {
    public readonly type = LinkInstancesActionType.UPDATE;

    public constructor(
      public payload: {
        linkInstance: LinkInstance;
        onSuccess?: () => void;
        onFailure?: () => void;
        afterSuccess?: () => void;
        nextAction?: Action;
      }
    ) {}
  }

  export class UpdateInternal implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_INTERNAL;

    public constructor(public payload: {linkInstance: LinkInstance}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_SUCCESS;

    public constructor(public payload: {linkInstance: LinkInstance; originalLinkInstance: LinkInstance}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = LinkInstancesActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any; originalLinkInstance?: LinkInstance}) {}
  }

  export class SetDocumentLinks implements Action {
    public readonly type = LinkInstancesActionType.SET_DOCUMENT_LINKS;

    public constructor(
      public payload: {
        linkTypeId: string;
        documentId: string;
        linkInstances: LinkInstance[];
        removedLinkInstancesIds: string[];
        onSuccess?: () => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class SetDocumentLinksSuccess implements Action {
    public readonly type = LinkInstancesActionType.SET_DOCUMENT_LINKS_SUCCESS;

    public constructor(public payload: {linkInstances: LinkInstance[]; removedLinkInstancesIds: string[]}) {}
  }

  export class SetDocumentLinksFailure implements Action {
    public readonly type = LinkInstancesActionType.SET_DOCUMENT_LINKS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangeDocuments implements Action {
    public readonly type = LinkInstancesActionType.CHANGE_DOCUMENTS;

    public constructor(
      public payload: {
        linkInstanceId: string;
        documentIds: [string, string];
        onSuccess?: () => void;
        onFailure?: () => void;
        afterSuccess?: () => void;
      }
    ) {}
  }

  export class Delete implements Action {
    public readonly type = LinkInstancesActionType.DELETE;

    public constructor(public payload: {linkInstanceId: string; nextAction?: Action}) {}
  }

  export class DeleteConfirm implements Action {
    public readonly type = LinkInstancesActionType.DELETE_CONFIRM;

    public constructor(public payload: {linkInstanceId: string; nextAction?: Action}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = LinkInstancesActionType.DELETE_SUCCESS;

    public constructor(public payload: {linkInstanceId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = LinkInstancesActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any; linkInstance: LinkInstance}) {}
  }

  export class Duplicate implements Action {
    public readonly type = LinkInstancesActionType.DUPLICATE;

    public constructor(
      public payload: {
        originalDocumentId: string;
        newDocumentId: string;
        linkInstanceIds: string[];
        documentIdsMap: Record<string, string>;
        onSuccess?: (linkInstances: LinkInstance[]) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class DuplicateSuccess implements Action {
    public readonly type = LinkInstancesActionType.DUPLICATE_SUCCESS;

    public constructor(public payload: {linkInstances: LinkInstance[]}) {}
  }

  export class Clear implements Action {
    public readonly type = LinkInstancesActionType.CLEAR;
  }

  export class ClearByLinkType implements Action {
    public readonly type = LinkInstancesActionType.CLEAR_BY_LINK_TYPE;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class ClearQueries implements Action {
    public readonly type = LinkInstancesActionType.CLEAR_QUERIES;

    public constructor(public payload: {linkTypeId?: string}) {}
  }

  export class SetLoadingQuery implements Action {
    public readonly type = LinkInstancesActionType.SET_LOADING_QUERY;

    public constructor(public payload: {query: DataQuery}) {}
  }

  export class RunRule implements Action {
    public readonly type = LinkInstancesActionType.RUN_RULE;

    public constructor(
      public payload: {linkTypeId: string; linkInstanceId: string; attributeId: string; actionName?: string}
    ) {}
  }

  export class RunRuleFailure implements Action {
    public readonly type = LinkInstancesActionType.RUN_RULE_FAILURE;

    public constructor(public payload: {linkInstanceId: string; attributeId: string; error: any}) {}
  }

  export type All =
    | Get
    | GetSingle
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateMultipleSuccess
    | CreateFailure
    | UpdateData
    | UpdateDataInternal
    | PatchData
    | PatchDataInternal
    | RevertData
    | Update
    | UpdateInternal
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteConfirm
    | DeleteSuccess
    | DeleteFailure
    | Duplicate
    | DuplicateSuccess
    | SetDocumentLinks
    | SetDocumentLinksSuccess
    | SetDocumentLinksFailure
    | Clear
    | ClearQueries
    | ClearByLinkType
    | SetLoadingQuery
    | RunRule
    | RunRuleFailure;
}
