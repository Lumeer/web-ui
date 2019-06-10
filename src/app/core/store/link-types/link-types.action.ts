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
import {Attribute} from '../collections/collection';
import {LinkType} from './link.type';
import {Workspace} from '../navigation/workspace';

export enum LinkTypesActionType {
  GET = '[Link Types] Get',
  GET_SINGLE = '[Link Types] Get Single',
  GET_SUCCESS = '[Link Types] Get :: Success',
  GET_FAILURE = '[Link Types] Get :: Failure',

  CREATE = '[Link Types] Create',
  CREATE_SUCCESS = '[Link Types] Create :: Success',
  CREATE_FAILURE = '[Link Types] Create :: Failure',

  UPDATE = '[Link Types] Update',
  UPDATE_SUCCESS = '[Link Types] Update :: Success',
  UPDATE_FAILURE = '[Link Types] Update :: Failure',

  DELETE = '[Link Types] Delete',
  DELETE_SUCCESS = '[Link Types] Delete :: Success',
  DELETE_FAILURE = '[Link Types] Delete :: Failure',

  CREATE_ATTRIBUTES = '[Link Types] Create Attributes',
  CREATE_ATTRIBUTES_SUCCESS = '[Link Types] Create Attributes :: Success',
  CREATE_ATTRIBUTES_FAILURE = '[Link Types] Create Attributes :: Failure',

  UPDATE_ATTRIBUTE = '[Link Types] Update Attribute',
  UPDATE_ATTRIBUTE_SUCCESS = '[Link Types] Update Attribute :: Success',
  UPDATE_ATTRIBUTE_FAILURE = '[Link Types] Update Attribute :: Failure',

  DELETE_ATTRIBUTE = '[Link Types] Delete Attribute',
  DELETE_ATTRIBUTE_SUCCESS = '[Link Types] Delete Attribute :: Success',
  DELETE_ATTRIBUTE_FAILURE = '[Link Types] Delete Attribute :: Failure',

  CLEAR = '[Link Types] Clear',
}

export namespace LinkTypesAction {
  export class Get implements Action {
    public readonly type = LinkTypesActionType.GET;

    public constructor(public payload: {workspace?: Workspace; force?: boolean}) {}
  }

  export class GetSingle implements Action {
    public readonly type = LinkTypesActionType.GET_SINGLE;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = LinkTypesActionType.GET_SUCCESS;

    public constructor(public payload: {linkTypes: LinkType[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = LinkTypesActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = LinkTypesActionType.CREATE;

    public constructor(public payload: {linkType: LinkType; callback?: (linkType: LinkType) => void}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = LinkTypesActionType.CREATE_SUCCESS;

    public constructor(public payload: {linkType: LinkType}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = LinkTypesActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = LinkTypesActionType.UPDATE;

    public constructor(public payload: {linkType: LinkType}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = LinkTypesActionType.UPDATE_SUCCESS;

    public constructor(public payload: {linkType: LinkType}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = LinkTypesActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = LinkTypesActionType.DELETE;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = LinkTypesActionType.DELETE_SUCCESS;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = LinkTypesActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class CreateAttributes implements Action {
    public readonly type = LinkTypesActionType.CREATE_ATTRIBUTES;

    public constructor(
      public payload: {
        linkTypeId: string;
        attributes: Attribute[];
        onSuccess?: (attributes: Attribute[]) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class CreateAttributesSuccess implements Action {
    public readonly type = LinkTypesActionType.CREATE_ATTRIBUTES_SUCCESS;

    public constructor(public payload: {linkTypeId: string; attributes: Attribute[]}) {}
  }

  export class CreateAttributesFailure implements Action {
    public readonly type = LinkTypesActionType.CREATE_ATTRIBUTES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class UpdateAttribute implements Action {
    public readonly type = LinkTypesActionType.UPDATE_ATTRIBUTE;

    public constructor(
      public payload: {
        linkTypeId: string;
        attributeId: string;
        attribute: Attribute;
        onSuccess?: (attribute: Attribute) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class UpdateAttributeSuccess implements Action {
    public readonly type = LinkTypesActionType.UPDATE_ATTRIBUTE_SUCCESS;

    public constructor(public payload: {linkTypeId: string; attribute: Attribute}) {}
  }

  export class UpdateAttributeFailure implements Action {
    public readonly type = LinkTypesActionType.UPDATE_ATTRIBUTE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class DeleteAttribute implements Action {
    public readonly type = LinkTypesActionType.DELETE_ATTRIBUTE;

    public constructor(
      public payload: {
        linkTypeId: string;
        attributeId: string;
        onSuccess?: () => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class DeleteAttributeSuccess implements Action {
    public readonly type = LinkTypesActionType.DELETE_ATTRIBUTE_SUCCESS;

    public constructor(public payload: {linkTypeId: string; attribute: Attribute}) {}
  }

  export class DeleteAttributeFailure implements Action {
    public readonly type = LinkTypesActionType.DELETE_ATTRIBUTE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Clear implements Action {
    public readonly type = LinkTypesActionType.CLEAR;
  }

  export type All =
    | Get
    | GetSingle
    | GetSuccess
    | GetFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | CreateAttributes
    | CreateAttributesSuccess
    | CreateAttributesFailure
    | UpdateAttribute
    | UpdateAttributeSuccess
    | UpdateAttributeFailure
    | DeleteAttribute
    | DeleteAttributeSuccess
    | DeleteAttributeFailure
    | Clear;
}
