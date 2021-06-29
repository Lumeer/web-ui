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

import {Injectable, Pipe, PipeTransform} from '@angular/core';

import {ResourceType} from '../../core/model/resource-type';
import {RoleType} from '../../core/model/role-type';

@Pipe({
  name: 'resourceRoles',
})
@Injectable({
  providedIn: 'root',
})
export class ResourceRolesPipe implements PipeTransform {
  public transform(resourceType: ResourceType): RoleType[] {
    switch (resourceType) {
      // TODO
      case ResourceType.Organization:
        return [RoleType.Read, RoleType.DataContribute, RoleType.Manage];
      case ResourceType.Project:
        return [RoleType.Read, RoleType.DataContribute, RoleType.Manage];
      case ResourceType.Collection:
        return [RoleType.Read, RoleType.DataContribute, RoleType.Manage];
      case ResourceType.View:
        return [RoleType.Read, RoleType.DataContribute, RoleType.Manage];
      default:
        return [];
    }
  }
}
