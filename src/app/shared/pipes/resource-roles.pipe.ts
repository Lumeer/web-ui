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

import {Injectable, Pipe, PipeTransform} from '@angular/core';

import {ResourceType} from '../../core/model/resource-type';
import {Role} from '../../core/model/role';

@Pipe({
  name: 'resourceRoles',
})
@Injectable({
  providedIn: 'root',
})
export class ResourceRolesPipe implements PipeTransform {
  public transform(resourceType: ResourceType): Role[] {
    switch (resourceType) {
      case ResourceType.Organization:
        return [Role.Read, Role.Write, Role.Manage];
      case ResourceType.Project:
        return [Role.Read, Role.Write, Role.Manage];
      case ResourceType.Collection:
        return [Role.Read, Role.Write, Role.Manage];
      case ResourceType.View:
        return [Role.Read, Role.Write, Role.Manage];
      default:
        return [];
    }
  }
}
