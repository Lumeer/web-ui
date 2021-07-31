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

import {User} from '../../core/store/users/user';
import {Resource} from '../../core/model/resource';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {ResourceType} from '../../core/model/resource-type';
import {Permission} from '../../core/store/permissions/permissions';
import {RoleType} from '../../core/model/role-type';
import {userRoleTypesInOrganization, userRoleTypesInProject, userRoleTypesInResource} from '../utils/permission.utils';

@Pipe({
  name: 'userRolesInResource',
})
@Injectable({
  providedIn: 'root',
})
export class UserRolesInResourcePipe implements PipeTransform {
  public transform(
    user: User,
    resource: Resource,
    resourceType: ResourceType,
    organization?: Organization,
    project?: Project,
    overridePermissions?: Record<string, {new: Permission}>
  ): RoleType[] {
    if (resourceType === ResourceType.Organization) {
      return userRoleTypesInOrganization(organization, user);
    } else if (resourceType === ResourceType.Project) {
      return userRoleTypesInProject(organization, project, user);
    }

    return userRoleTypesInResource(organization, project, resource, user);
  }
}
