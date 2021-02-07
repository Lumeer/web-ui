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
import {Organization} from './organization';
import {Permission, PermissionType} from '../permissions/permissions';
import {Workspace} from '../navigation/workspace';
import {Project} from '../projects/project';
import {NavigationExtras} from '@angular/router';
import {Subject} from 'rxjs';

export enum OrganizationsActionType {
  GET = '[Organizations] Get',
  GET_SINGLE = '[Organizations] Get Single',
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

  CHOOSE = '[Organizations] Choose',

  OFFER_PAYMENT = '[Organizations] Offer payment',

  DELETE = '[Organizations] Delete',
  DELETE_SUCCESS = '[Organizations] Delete :: Success',
  DELETE_FAILURE = '[Organizations] Delete :: Failure',

  CHANGE_PERMISSION = '[Organizations] Change Permission',
  CHANGE_PERMISSION_SUCCESS = '[Organizations] Change Permission :: Success',
  CHANGE_PERMISSION_FAILURE = '[Organizations] Change Permission :: Failure',
}

export namespace OrganizationsAction {
  export class Get implements Action {
    public readonly type = OrganizationsActionType.GET;
  }

  export class GetSingle implements Action {
    public readonly type = OrganizationsActionType.GET_SINGLE;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = OrganizationsActionType.GET_SUCCESS;

    public constructor(public payload: {organizations: Organization[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = OrganizationsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetOneSuccess implements Action {
    public readonly type = OrganizationsActionType.GET_ONE_SUCCESS;

    public constructor(public payload: {organization: Organization}) {}
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
      public payload: {
        organization: Organization;
        onSuccess?: (organization: Organization) => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = OrganizationsActionType.CREATE_SUCCESS;

    public constructor(public payload: {organization: Organization}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = OrganizationsActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = OrganizationsActionType.UPDATE;

    public constructor(public payload: {organization: Organization}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = OrganizationsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {organization: Organization; oldCode?: string}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = OrganizationsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Choose implements Action {
    public readonly type = OrganizationsActionType.CHOOSE;

    public constructor(
      public payload: {
        organizations: Organization[];
        initialCode: string;
        onClose$: Subject<any>;
        copyProject?: Project;
        templateId?: string;
        navigationExtras?: NavigationExtras;
        previousDialogState?: any;
      }
    ) {}
  }

  export class OfferPayment implements Action {
    public readonly type = OrganizationsActionType.OFFER_PAYMENT;

    public constructor(public payload: {organizationCode: string; message?: string; title?: string}) {}
  }

  export class Delete implements Action {
    public readonly type = OrganizationsActionType.DELETE;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = OrganizationsActionType.DELETE_SUCCESS;

    public constructor(public payload: {organizationId: string; organizationCode?: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = OrganizationsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangePermission implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION;

    public constructor(
      public payload: {
        organizationId: string;
        type: PermissionType;
        permissions: Permission[];
        currentPermissions: Permission[];
        workspace?: Workspace;
      }
    ) {}
  }

  export class ChangePermissionSuccess implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION_SUCCESS;

    public constructor(public payload: {organizationId: string; type: PermissionType; permissions: Permission[]}) {}
  }

  export class ChangePermissionFailure implements Action {
    public readonly type = OrganizationsActionType.CHANGE_PERMISSION_FAILURE;

    public constructor(
      public payload: {organizationId: string; type: PermissionType; permissions: Permission[]; error: any}
    ) {}
  }

  export type All =
    | Get
    | GetSingle
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
    | Choose
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | ChangePermission
    | ChangePermissionSuccess
    | ChangePermissionFailure;
}
