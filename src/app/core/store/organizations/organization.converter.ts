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
import {OrganizationDto} from '../../dto';
import {convertPermissionsDtoToModel} from '../permissions/permissions.converter';
import {Organization} from './organization';

export class OrganizationConverter {
  public static fromDto(dto: OrganizationDto, correlationId?: string): Organization {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      priority: dto.priority,
      description: dto.description,
      correlationId: correlationId,
      nonRemovable: dto.nonRemovable,
      permissions: convertPermissionsDtoToModel(dto.permissions),
      version: dto.version,
    };
  }

  public static toDto(organization: Organization): OrganizationDto {
    return {
      code: organization.code,
      name: organization.name,
      icon: organization.icon,
      color: organization.color,
      priority: organization.priority,
      description: organization.description,
    };
  }
}
