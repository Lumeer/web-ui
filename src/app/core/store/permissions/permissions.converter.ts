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

import {Permission} from '../../dto/permission';
import {Permissions} from '../../dto/permissions';
import {PermissionModel, PermissionsModel} from './permissions.model';

export class PermissionsConverter {
  public static fromDto(dto: Permissions): PermissionsModel {
    if (!dto) {
      return null;
    }

    return {
      users: dto.users ? dto.users.map(PermissionsConverter.fromPermissionDto) : [],
      groups: dto.groups ? dto.groups.map(PermissionsConverter.fromPermissionDto) : [],
    };
  }

  public static toDto(permissions: PermissionsModel): Permissions {
    if (!permissions) {
      return null;
    }

    return {
      users: permissions.users ? permissions.users.map(PermissionsConverter.toPermissionDto) : [],
      groups: permissions.groups ? permissions.groups.map(PermissionsConverter.toPermissionDto) : [],
    };
  }

  public static fromPermissionDto(dto: Permission): PermissionModel {
    return {
      id: dto.id,
      roles: dto.roles,
    };
  }

  public static toPermissionDto(permission: PermissionModel): Permission {
    return {
      id: permission.id,
      roles: permission.roles,
    };
  }
}
