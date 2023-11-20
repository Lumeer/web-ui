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

import {FileApiPath} from '../../data-service/attachments/attachments.service';
import {Query} from '../navigation/query/query';
import {View} from '../views/view';
import {FileAttachment} from './file-attachment.model';

export enum FileAttachmentsActionType {
  CREATE = '[File Attachments] Create',
  CREATE_SUCCESS = '[File Attachments] Create :: Success',

  SET_UPLOADING = '[File Attachments] Set Uploading',

  REMOVE = '[File Attachments] Remove',
  REMOVE_SUCCESS = '[File Attachments] Remove :: Success',

  GET = '[File Attachments] Get',
  GET_SUCCESS = '[File Attachments] Get :: Success',

  SET_LOADING = '[File Attachments] Set Loading',

  GET_BY_QUERY = '[File Attachments] Get By Query',
  GET_BY_VIEW = '[File Attachments] Get By View',

  CLEAR = '[File Attachments] Clear',
}

export namespace FileAttachmentsAction {
  export class Create implements Action {
    public readonly type = FileAttachmentsActionType.CREATE;

    constructor(
      public payload: {
        fileAttachment: FileAttachment;
        onSuccess?: (file: FileAttachment) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = FileAttachmentsActionType.CREATE_SUCCESS;

    constructor(public payload: {fileAttachments: FileAttachment[]}) {}
  }

  export class SetUploading implements Action {
    public readonly type = FileAttachmentsActionType.SET_UPLOADING;

    constructor(public payload: {fileId: string; uploading: boolean}) {}
  }

  export class Remove implements Action {
    public readonly type = FileAttachmentsActionType.REMOVE;

    constructor(public payload: {fileId: string; onSuccess?: () => void; onFailure?: (error: any) => void}) {}
  }

  export class RemoveSuccess implements Action {
    public readonly type = FileAttachmentsActionType.REMOVE_SUCCESS;

    constructor(public payload: {fileIds: string[]}) {}
  }

  interface GetPayload {
    collectionId?: string;
    documentId?: string;
    linkTypeId?: string;
    linkInstanceId?: string;
    attributeId?: string;
  }

  export class Get implements Action {
    public readonly type = FileAttachmentsActionType.GET;

    constructor(
      public payload: GetPayload & {
        onSuccess?: (files: FileAttachment[]) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class GetSuccess implements Action {
    public readonly type = FileAttachmentsActionType.GET_SUCCESS;

    constructor(public payload: {fileAttachments: FileAttachment[]; path: FileApiPath}) {}
  }

  export class SetLoading implements Action {
    public readonly type = FileAttachmentsActionType.SET_LOADING;

    constructor(
      public payload: GetPayload & {
        loading: boolean;
      }
    ) {}
  }

  export class GetByQuery implements Action {
    public readonly type = FileAttachmentsActionType.GET_BY_QUERY;

    constructor(
      public payload: {
        organizationId?: string;
        projectId?: string;
        view?: View;
        query: Query;
      }
    ) {}
  }

  export class GetByView implements Action {
    public readonly type = FileAttachmentsActionType.GET_BY_VIEW;

    constructor(public payload: {viewId?: string}) {}
  }

  export class Clear implements Action {
    public readonly type = FileAttachmentsActionType.CLEAR;
  }

  export type All =
    | Create
    | CreateSuccess
    | Remove
    | RemoveSuccess
    | SetUploading
    | Get
    | GetSuccess
    | SetLoading
    | GetByQuery
    | Clear;
}
