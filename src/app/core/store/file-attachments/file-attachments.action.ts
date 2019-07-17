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
import {Query} from '../navigation/query';
import {FileAttachment} from './file-attachment.model';

export enum FileAttachmentsActionType {
  CREATE = '[File Attachments] Create',
  CREATE_SUCCESS = '[File Attachments] Create :: Success',

  REMOVE = '[File Attachments] Remove',
  REMOVE_SUCCESS = '[File Attachments] Remove :: Success',

  GET = '[File Attachments] Get',
  GET_SUCCESS = '[File Attachments] Get :: Success',

  GET_BY_QUERY = '[File Attachments] Get By Query',

  GET_DETAILS = '[File Attachments] Get Details',

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

    constructor(public payload: {fileAttachment: FileAttachment}) {}
  }

  export class Remove implements Action {
    public readonly type = FileAttachmentsActionType.REMOVE;

    constructor(public payload: {fileId: string; onSuccess?: () => void; onFailure?: (error: any) => void}) {}
  }

  export class RemoveSuccess implements Action {
    public readonly type = FileAttachmentsActionType.REMOVE_SUCCESS;

    constructor(public payload: {fileId: string}) {}
  }

  export class Get implements Action {
    public readonly type = FileAttachmentsActionType.GET;

    constructor(
      public payload: {
        collectionId?: string;
        documentId?: string;
        linkTypeId?: string;
        linkInstanceId?: string;
        attributeId?: string;
        onSuccess?: (files: FileAttachment[]) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class GetSuccess implements Action {
    public readonly type = FileAttachmentsActionType.GET_SUCCESS;

    constructor(public payload: {fileAttachments: FileAttachment[]}) {}
  }

  export class GetByQuery implements Action {
    public readonly type = FileAttachmentsActionType.GET_BY_QUERY;

    constructor(
      public payload: {
        organizationId?: string;
        projectId?: string;
        query: Query;
      }
    ) {}
  }

  export class GetDetails implements Action {
    public readonly type = FileAttachmentsActionType.GET_DETAILS;

    constructor(public payload: {collectionId: string; documentId: string; attributeId: string}) {}
  }

  export class Clear implements Action {
    public readonly type = FileAttachmentsActionType.CLEAR;
  }

  export type All =
    | Create
    | CreateSuccess
    | Remove
    | RemoveSuccess
    | Get
    | GetSuccess
    | GetByQuery
    | GetDetails
    | Clear;
}
