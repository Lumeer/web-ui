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
import {AllowedPermissions} from '../../model/allowed-permissions';

export enum UserPermissionsActionType {
  SET_ORGANIZATION_PERMISSIONS = '[User Permissions] Set Organization Permissions',
  SET_PROJECT_PERMISSIONS = '[User Permissions] Set Project Permissions',
  SET_COLLECTIONS_PERMISSIONS = '[User Permissions] Set Collections Permissions',
  SET_LINK_TYPES_PERMISSIONS = '[User Permissions] Set LinkTypes Permissions',
  SET_VIEWS_PERMISSIONS = '[User Permissions] Set Views Permissions',

  CLEAR = '[User Permissions] Clear',
}

export namespace UserPermissionsAction {
  export class SetOrganizationPermissions implements Action {
    public readonly type = UserPermissionsActionType.SET_ORGANIZATION_PERMISSIONS;

    public constructor(public payload: {permissions: AllowedPermissions}) {}
  }

  export class SetProjectPermissions implements Action {
    public readonly type = UserPermissionsActionType.SET_PROJECT_PERMISSIONS;

    public constructor(public payload: {permissions: AllowedPermissions}) {}
  }

  export class SetCollectionsPermissions implements Action {
    public readonly type = UserPermissionsActionType.SET_COLLECTIONS_PERMISSIONS;

    public constructor(public payload: {permissions: Record<string, AllowedPermissions>}) {}
  }

  export class SetLinkTypesPermissions implements Action {
    public readonly type = UserPermissionsActionType.SET_LINK_TYPES_PERMISSIONS;

    public constructor(public payload: {permissions: Record<string, AllowedPermissions>}) {}
  }

  export class SetViewsPermissions implements Action {
    public readonly type = UserPermissionsActionType.SET_VIEWS_PERMISSIONS;

    public constructor(public payload: {permissions: Record<string, AllowedPermissions>}) {}
  }

  export class Clear implements Action {
    public readonly type = UserPermissionsActionType.CLEAR;
  }

  export type All =
    | SetOrganizationPermissions
    | SetProjectPermissions
    | SetCollectionsPermissions
    | SetLinkTypesPermissions
    | SetViewsPermissions
    | Clear;
}
