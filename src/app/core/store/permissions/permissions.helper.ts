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

import {PermissionModel, PermissionsModel, PermissionType} from './permissions.model';

export class PermissionsHelper {
  public static changePermission(
    permissions: PermissionsModel,
    type: PermissionType,
    permission: PermissionModel
  ): PermissionsModel {
    const entityPermissions: PermissionModel[] = permissions ? permissions[type].slice() : [];

    const index = entityPermissions.findIndex(p => p.id === permission.id);
    if (index !== -1) {
      entityPermissions.splice(index, 1, permission);
    } else {
      entityPermissions.push(permission);
    }

    const permissionsCopy: PermissionsModel = {...permissions};
    permissionsCopy[type] = entityPermissions;
    return permissionsCopy;
  }

  public static removePermission(permissions: PermissionsModel, type: PermissionType, name: string): PermissionsModel {
    const entityPermissions: PermissionModel[] = permissions ? permissions[type].slice() : [];

    const index = entityPermissions.findIndex(p => p.id === name);
    if (index) {
      entityPermissions.splice(index, 1);
    }

    const permissionsCopy: PermissionsModel = {...permissions};
    permissionsCopy[type] = entityPermissions;
    return permissionsCopy;
  }
}
