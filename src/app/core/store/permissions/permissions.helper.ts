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
import {Permission, PermissionType, Permissions, Role} from './permissions';

export class PermissionsHelper {
  public static changePermission(
    permissions: Permissions,
    type: PermissionType,
    newPermissions: Permission[]
  ): Permissions {
    const entityPermissions: Permission[] = permissions ? permissions[type].slice() : [];

    for (const permission of newPermissions) {
      const index = entityPermissions.findIndex(p => p.id === permission.id);
      if (index !== -1) {
        entityPermissions.splice(index, 1, permission);
      } else {
        entityPermissions.push(permission);
      }
    }

    const permissionsCopy: Permissions = {...permissions};
    permissionsCopy[type] = entityPermissions;
    return permissionsCopy;
  }
}

export function rolesAreSame(r1: Role, r2: Role): boolean {
  return r1.type === r2.type && !!r1.transitive === !!r2.transitive;
}
