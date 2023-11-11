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

import {RoleType, roleTypesMap} from './role-type';

export interface AllowedPermissions {
  roles?: Record<RoleType, boolean>;
  rolesWithView?: Record<RoleType, boolean>;
}

export type AllowedPermissionsMap = Record<string, AllowedPermissions>;

export interface ResourcesPermissions {
  collections: AllowedPermissionsMap;
  linkTypes: AllowedPermissionsMap;
}

export const completeAllowedPermissions: AllowedPermissions = {
  roles: transformRoleTypesMap(),
  rolesWithView: transformRoleTypesMap(),
};

function transformRoleTypesMap(): Record<RoleType, boolean> {
  return Object.keys(roleTypesMap).reduce(
    (map, key) => {
      map[key] = true;
      return map;
    },
    {} as Record<RoleType, boolean>
  );
}
