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

import {ResourcePermissionType} from '../../../core/model/resource-permission-type';
import {Role} from '../../../core/store/permissions/permissions';
import {rolesAreSame} from '../../../core/store/permissions/permissions.helper';

export interface RoleGroup {
  title?: string;
  order: number;
  roles: TranslatedRole[];
}

export interface TranslatedRole extends Role {
  title: string;
  tooltip?: string;
  fromParentOrTeams?: boolean;
  permissionType: ResourcePermissionType;
}

export function translatedRolesAreSame(t1: TranslatedRole, t2: TranslatedRole): boolean {
  return rolesAreSame(t1, t2) && t1.permissionType === t2.permissionType;
}

export function translatedRolesToMap(roles: TranslatedRole[]): Record<ResourcePermissionType, TranslatedRole[]> {
  return roles.reduce(
    (map, role) => {
      if (!map[role.permissionType]) {
        map[role.permissionType] = [];
      }
      map[role.permissionType].push(role);
      return map;
    },
    {} as Record<ResourcePermissionType, TranslatedRole[]>
  );
}
