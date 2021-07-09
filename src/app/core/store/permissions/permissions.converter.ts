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

import {Permission, Permissions, Role} from './permissions';
import {PermissionDto, PermissionsDto} from '../../dto';
import {RoleDto} from '../../dto/role.dto';
import {roleTypesMap} from '../../model/role-type';

export function convertPermissionsDtoToModel(dto: PermissionsDto): Permissions {
  return (
    dto && {
      users: dto.users?.map(convertPermissionDtoToModel) || [],
      groups: dto.groups?.map(convertPermissionDtoToModel) || [],
    }
  );
}

export function convertPermissionsModelToDto(permissions: Permissions): PermissionsDto {
  return (
    permissions && {
      users: permissions.users?.map(convertPermissionModelToDto) || [],
      groups: permissions.groups?.map(convertPermissionModelToDto) || [],
    }
  );
}

export function convertPermissionDtoToModel(dto: PermissionDto): Permission {
  return {
    id: dto.id,
    roles: dto.roles?.map(convertRoleDtoToModel) || [],
  };
}

export function convertPermissionModelToDto(permission: Permission): PermissionDto {
  return {
    id: permission.id,
    roles: permission.roles?.map(convertRoleModelToDto) || [],
  };
}

export function convertRoleDtoToModel(dto: RoleDto): Role {
  return (
    dto && {
      type: roleTypesMap[dto.type],
      transitive: dto.transitive,
    }
  );
}

export function convertRoleModelToDto(model: Role): RoleDto {
  return (
    model && {
      type: model.type.toString(),
      transitive: model.transitive,
    }
  );
}
