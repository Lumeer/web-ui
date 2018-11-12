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
import {ImportedCollection} from '../../dto/imported-collection';
import {QueryModel} from '../navigation/query.model';
import {Workspace} from '../navigation/workspace.model';
import {PermissionModel, PermissionType} from '../permissions/permissions.model';
import {AttributeModel, CollectionModel} from './collection.model';

export enum CollectionsActionType {
  GET = '[Collections] Get',
  GET_SUCCESS = '[Collections] Get :: Success',
  GET_FAILURE = '[Collections] Get :: Failure',

  GET_NAMES = '[Collections] Get Collection Names',
  GET_NAMES_SUCCESS = '[Collections] Get Collection Names :: Success',
  GET_NAMES_FAILURE = '[Collections] Get Collection Names :: Failure',

  ADD_NAME = '[Collections] Add Collection Name',
  DELETE_NAME = '[Collections] Delete Collection Name',

  CREATE = '[Collections] Create',
  CREATE_SUCCESS = '[Collections] Create :: Success',
  CREATE_FAILURE = '[Collections] Create :: Failure',

  IMPORT = '[Collections] Import',
  IMPORT_SUCCESS = '[Collections] Import :: Success',
  IMPORT_FAILURE = '[Collections] Import :: Failure',

  UPDATE = '[Collections] Update',
  UPDATE_SUCCESS = '[Collections] Update :: Success',
  UPDATE_FAILURE = '[Collections] Update :: Failure',

  DELETE = '[Collections] Delete',
  DELETE_SUCCESS = '[Collections] Delete :: Success',
  DELETE_FAILURE = '[Collections] Delete :: Failure',

  ADD_FAVORITE = '[Collections] Add Favorite',
  ADD_FAVORITE_SUCCESS = '[Collections] Add Favorite :: Success',
  ADD_FAVORITE_FAILURE = '[Collections] Add Favorite :: Failure',

  REMOVE_FAVORITE = '[Collections] Remove Favorite',
  REMOVE_FAVORITE_SUCCESS = '[Collections] Remove Favorite :: Success',
  REMOVE_FAVORITE_FAILURE = '[Collections] Remove Favorite :: Failure',

  SET_DEFAULT_ATTRIBUTE = '[Collections] Set Default Attribute',
  SET_DEFAULT_ATTRIBUTE_SUCCESS = '[Collections] Set Default Attribute :: Success',
  SET_DEFAULT_ATTRIBUTE_FAILURE = '[Collections] Set Default Attribute :: Failure',

  CHANGE_ATTRIBUTE = '[Collections] Change Attribute',
  CHANGE_ATTRIBUTE_SUCCESS = '[Collections] Change Attribute :: Success',
  CHANGE_ATTRIBUTE_FAILURE = '[Collections] Change Attribute :: Failure',

  CREATE_ATTRIBUTES = '[Collections] Create Attributes',
  CREATE_ATTRIBUTES_SUCCESS = '[Collections] Create Attributes :: Success',
  CREATE_ATTRIBUTES_FAILURE = '[Collections] Create Attributes :: Failure',

  REMOVE_ATTRIBUTE = '[Collections] Remove Attribute',
  REMOVE_ATTRIBUTE_SUCCESS = '[Collections] Remove Attribute :: Success',
  REMOVE_ATTRIBUTE_FAILURE = '[Collections] Remove Attribute :: Failure',

  CHANGE_PERMISSION = '[Collections] Change Permission',
  CHANGE_PERMISSION_SUCCESS = '[Collections] Change Permission :: Success',
  CHANGE_PERMISSION_FAILURE = '[Collections] Change Permission :: Failure',

  CLEAR = '[Collections] Clear',
}

export namespace CollectionsAction {
  export class Get implements Action {
    public readonly type = CollectionsActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = CollectionsActionType.GET_SUCCESS;

    public constructor(public payload: {collections: CollectionModel[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = CollectionsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetNames implements Action {
    public readonly type = CollectionsActionType.GET_NAMES;
  }

  export class GetNamesSuccess implements Action {
    public readonly type = CollectionsActionType.GET_NAMES_SUCCESS;

    public constructor(public payload: {collectionNames: string[]}) {}
  }

  export class GetNamesFailure implements Action {
    public readonly type = CollectionsActionType.GET_NAMES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class AddName implements Action {
    public readonly type = CollectionsActionType.ADD_NAME;

    public constructor(public payload: {name: string}) {}
  }

  export class DeleteName implements Action {
    public readonly type = CollectionsActionType.DELETE_NAME;

    public constructor(public payload: {name: string}) {}
  }

  export class Create implements Action {
    public readonly type = CollectionsActionType.CREATE;

    public constructor(
      public payload: {collection: CollectionModel; callback?: (collection: CollectionModel) => void}
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = CollectionsActionType.CREATE_SUCCESS;

    public constructor(public payload: {collection: CollectionModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = CollectionsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Import implements Action {
    public readonly type = CollectionsActionType.IMPORT;

    public constructor(
      public payload: {
        format: string;
        importedCollection: ImportedCollection;
        callback?: (collection: CollectionModel) => void;
      }
    ) {}
  }

  export class ImportSuccess implements Action {
    public readonly type = CollectionsActionType.IMPORT_SUCCESS;

    public constructor(public payload: {collection: CollectionModel}) {}
  }

  export class ImportFailure implements Action {
    public readonly type = CollectionsActionType.IMPORT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = CollectionsActionType.UPDATE;

    public constructor(public payload: {collection: CollectionModel; callback?: () => void}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = CollectionsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {collection: CollectionModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = CollectionsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = CollectionsActionType.DELETE;

    public constructor(public payload: {collectionId: string; callback?: (collectionId: string) => void}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = CollectionsActionType.DELETE_SUCCESS;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = CollectionsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class AddFavorite implements Action {
    public readonly type = CollectionsActionType.ADD_FAVORITE;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class AddFavoriteSuccess implements Action {
    public readonly type = CollectionsActionType.ADD_FAVORITE_SUCCESS;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class AddFavoriteFailure implements Action {
    public readonly type = CollectionsActionType.ADD_FAVORITE_FAILURE;

    public constructor(public payload: {collectionId: string; error: any}) {}
  }

  export class RemoveFavorite implements Action {
    public readonly type = CollectionsActionType.REMOVE_FAVORITE;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class RemoveFavoriteSuccess implements Action {
    public readonly type = CollectionsActionType.REMOVE_FAVORITE_SUCCESS;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class RemoveFavoriteFailure implements Action {
    public readonly type = CollectionsActionType.REMOVE_FAVORITE_FAILURE;

    public constructor(public payload: {collectionId: string; error: any}) {}
  }

  export class SetDefaultAttribute implements Action {
    public readonly type = CollectionsActionType.SET_DEFAULT_ATTRIBUTE;

    public constructor(public payload: {collectionId: string; attributeId: string}) {}
  }

  export class SetDefaultAttributeSuccess implements Action {
    public readonly type = CollectionsActionType.SET_DEFAULT_ATTRIBUTE_SUCCESS;

    public constructor(public payload: {collectionId: string; attributeId: string}) {}
  }

  export class SetDefaultAttributeFailure implements Action {
    public readonly type = CollectionsActionType.SET_DEFAULT_ATTRIBUTE_FAILURE;

    public constructor(public payload: {collectionId: string; oldDefaultAttributeId: string; error: any}) {}
  }

  export class CreateAttributes implements Action {
    public readonly type = CollectionsActionType.CREATE_ATTRIBUTES;

    public constructor(
      public payload: {
        collectionId: string;
        attributes: AttributeModel[];
        nextAction?: Action;
        callback?: (attributes: AttributeModel[]) => void;
      }
    ) {}
  }

  export class CreateAttributesSuccess implements Action {
    public readonly type = CollectionsActionType.CREATE_ATTRIBUTES_SUCCESS;

    public constructor(public payload: {collectionId: string; attributes: AttributeModel[]}) {}
  }

  export class CreateAttributesFailure implements Action {
    public readonly type = CollectionsActionType.CREATE_ATTRIBUTES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangeAttribute implements Action {
    public readonly type = CollectionsActionType.CHANGE_ATTRIBUTE;

    public constructor(
      public payload: {collectionId: string; attributeId: string; attribute: AttributeModel; nextAction?: Action}
    ) {}
  }

  export class ChangeAttributeSuccess implements Action {
    public readonly type = CollectionsActionType.CHANGE_ATTRIBUTE_SUCCESS;

    public constructor(public payload: {collectionId: string; attributeId: string; attribute: AttributeModel}) {}
  }

  export class ChangeAttributeFailure implements Action {
    public readonly type = CollectionsActionType.CHANGE_ATTRIBUTE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class RemoveAttribute implements Action {
    public readonly type = CollectionsActionType.REMOVE_ATTRIBUTE;

    public constructor(public payload: {collectionId: string; attributeId: string}) {}
  }

  export class RemoveAttributeSuccess implements Action {
    public readonly type = CollectionsActionType.REMOVE_ATTRIBUTE_SUCCESS;

    public constructor(public payload: {collectionId: string; attributeId: string}) {}
  }

  export class RemoveAttributeFailure implements Action {
    public readonly type = CollectionsActionType.REMOVE_ATTRIBUTE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangePermission implements Action {
    public readonly type = CollectionsActionType.CHANGE_PERMISSION;

    public constructor(
      public payload: {
        collectionId: string;
        type: PermissionType;
        permission: PermissionModel;
        currentPermission: PermissionModel;
      }
    ) {}
  }

  export class ChangePermissionSuccess implements Action {
    public readonly type = CollectionsActionType.CHANGE_PERMISSION_SUCCESS;

    public constructor(public payload: {collectionId: string; type: PermissionType; permission: PermissionModel}) {}
  }

  export class ChangePermissionFailure implements Action {
    public readonly type = CollectionsActionType.CHANGE_PERMISSION_FAILURE;

    public constructor(
      public payload: {collectionId: string; type: PermissionType; permission: PermissionModel; error: any}
    ) {}
  }

  export class Clear implements Action {
    public readonly type = CollectionsActionType.CLEAR;
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | GetNames
    | GetNamesSuccess
    | GetNamesFailure
    | AddName
    | DeleteName
    | Create
    | CreateSuccess
    | CreateFailure
    | Import
    | ImportSuccess
    | ImportFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | AddFavorite
    | AddFavoriteSuccess
    | AddFavoriteFailure
    | RemoveFavorite
    | RemoveFavoriteSuccess
    | RemoveFavoriteFailure
    | SetDefaultAttribute
    | SetDefaultAttributeSuccess
    | SetDefaultAttributeFailure
    | CreateAttributes
    | CreateAttributesSuccess
    | CreateAttributesFailure
    | ChangeAttribute
    | ChangeAttributeSuccess
    | ChangeAttributeFailure
    | RemoveAttribute
    | RemoveAttributeSuccess
    | RemoveAttributeFailure
    | ChangePermission
    | ChangePermissionSuccess
    | ChangePermissionFailure
    | Clear;
}
