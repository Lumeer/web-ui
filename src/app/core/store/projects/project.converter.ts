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

import {ProjectDto} from '../../dto';
import {convertPermissionsDtoToModel} from '../permissions/permissions.converter';
import {Project} from './project';

export class ProjectConverter {
  public static fromDto(dto: ProjectDto, organizationId?: string, correlationId?: string): Project {
    return {
      id: dto.id,
      organizationId: organizationId,
      code: dto.code,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      priority: dto.priority,
      description: dto.description,
      correlationId: correlationId,
      collectionsCount: dto.collectionsCount,
      nonRemovable: dto.nonRemovable,
      permissions: convertPermissionsDtoToModel(dto.permissions),
      version: dto.version,
      templateMetadata: dto.templateMetadata && {
        ...dto.templateMetadata,
        relativeDate: dto.templateMetadata.relativeDate && new Date(dto.templateMetadata.relativeDate),
      },
      isPublic: dto.public,
    };
  }

  public static toDto(project: Project): ProjectDto {
    return {
      code: project.code,
      name: project.name || '',
      icon: project.icon,
      color: project.color,
      priority: project.priority,
      description: project.description || '',
      templateMetadata:
        (project.templateMetadata && {
          ...project.templateMetadata,
          relativeDate: project.templateMetadata.relativeDate?.getTime(),
        }) ||
        {},
      public: project.isPublic || false,
    };
  }
}
