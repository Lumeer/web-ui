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

import {Project} from '../../dto';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {ProjectModel} from './project.model';

export class ProjectConverter {

  public static fromDto(dto: Project, organizationId: string, correlationId?: string): ProjectModel {
    return {
      id: dto.id,
      organizationId: organizationId,
      code: dto.code,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      description: dto.description,
      correlationId: correlationId,
      collectionsCount: dto.collectionsCount,
      permissions: PermissionsConverter.fromDto(dto.permissions)
    };
  }

  public static toDto(project: ProjectModel): Project {
    return {
      code: project.code,
      name: project.name,
      icon: project.icon,
      color: project.color,
      description: project.description
    };
  }

}
