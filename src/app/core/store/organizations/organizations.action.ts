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
import {OrganizationModel} from './organization.model';
import {PermissionModel, PermissionType} from '../permissions/permissions.model';

export enum OrganizationsActionType {
  GET = '[Organizations] Get',
  GET_SUCCESS = '[Organizations] Get :: Success',
  GET_FAILURE = '[Organizations] Get :: Failure',

  GET_ONE_SUCCESS = '[Organizations] Get one :: Success',

  GET_CODES = '[Organizations] Get codes',
  GET_CODES_SUCCESS = '[Organizations] Get codes :: Success',
  GET_CODES_FAILURE = '[Organizations] Get codes :: Failure',

  CREATE = '[Organizations] Create',
  CREATE_SUCCESS = '[Organizations] Create :: Success',
  CREATE_FAILURE = '[Organizations] Create :: Failure',

  UPDATE = '[Organizations] Update',
  UPDATE_SUCCESS = '[Organizations] Update :: Success',
  UPDATE_FAILURE = '[Organizations] Update :: Failure',

  DELETE = '[Organizations] Delete',
  DELETE_SUCCESS = '[Organizations] Delete :: Success',
  DELETE_FAILURE = '[Organizations] Delete :: Failure',

  SELECT = '[Organizations] Select',

  CHANGE_PERMISSION = '[Organizations] Change Permission',
  CHANGE_PERMISSION_SUCCESS = '[Organizations] Change Permission :: Success',
  CHANGE_PERMISSION_FAILURE = '[Organizations] Change Permission :: Failure',
}

export namespace OrganizationsAction {
  export class Get implements Action {
    public readonly type = OrganizationsActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = OrganizationsActionType.GET_SUCCESS;

    public constructor(public payload: {organizations: OrganizationModel[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = OrganizationsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetOneSuccess implements Action {
    public readonly type = OrganizationsActionType.GET_ONE_SUCCESS;

    public constructor(public payload: {organization: OrganizationModel}) {}
  }

  export class GetCodes implements Action {
    public readonly type = OrganizationsActionType.GET_CODES;
  }

  export class GetCodesSuccess implements Action {
    public readonly type = OrganizationsActionType.GET_CODES_SUCCESS;

    public constructor(public payload: {organizationCodes: string[]}) {}
  }

  export class GetCodesFailure implements Action {
    public readonly type = OrganizationsActionType.GET_CODES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = OrganizationsActionType.CREATE;

    public constructor(
      public payload: {organization: OrganizationModel; callback?: (organization: OrganizationModel) => void}
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = OrganizationsActionType.CREATE_SUCCESS;

    public constructor(public payload: {organization: OrganizationModel}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = OrganizationsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = OrganizationsActionType.UPDATE;

    public constructor(public payload: {organization: OrganizationModel}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = OrganizationsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {organization: OrganizationModel}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = OrganizationsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = OrganizationsActionType.DELETE;

    public constructor(public payload: {organizationId: string; onSuccess?: () => void}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = OrganizationsActionType.DELETE_SUCCESS;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = OrganizationsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Select implements Action {
    public readonly type = OrganizationsActionType.SELECT;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class ChangePermission implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION;

    public constructor(
      public payload: {
        organizationId: string;
        type: PermissionType;
        permission: PermissionModel;
        currentPermission: PermissionModel;
      }
    ) {}
  }

  export class ChangePermissionSuccess implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION_SUCCESS;

    public constructor(public payload: {organizationId: string; type: PermissionType; permission: PermissionModel}) {}
  }

  export class ChangePermissionFailure implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION_FAILURE;

    public constructor(
      public payload: {organizationId: string; type: PermissionType; permission: PermissionModel; error: any}
    ) {}
  }

  export type All =
    | Select
    | Get
    | GetSuccess
    | GetFailure
    | GetOneSuccess
    | GetCodes
    | GetCodesSuccess
    | GetCodesFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | Select
    | ChangePermission
    | ChangePermissionSuccess
    | ChangePermissionFailure;
}
