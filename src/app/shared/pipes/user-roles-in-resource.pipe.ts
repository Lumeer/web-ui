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
import {ResourceRolesPipe} from './resource-roles.pipe';
import {userHasManageRoleInResource, userIsManagerInWorkspace} from '../utils/resource.utils';
import {Permission} from '../../core/store/permissions/permissions';

@Pipe({
  name: 'userRolesInResource',
})
@Injectable({
  providedIn: 'root',
})
export class UserRolesInResourcePipe implements PipeTransform {
  constructor(private resourceRolesPipe: ResourceRolesPipe) {}

  public transform(
    user: User,
    resource: Resource,
    resourceType: ResourceType,
    organization?: Organization,
    project?: Project,
    overridePermissions?: Record<string, {new: Permission}>
  ): string[] {
    const userPermission =
      overridePermissions?.[user.id]?.new || resource?.permissions?.users?.find(perm => perm.id === user.id);
    const roles = userPermission ? userPermission.roles : [];

    if (resourceType === ResourceType.Organization) {
      return roles;
    } else if (resourceType === ResourceType.Project) {
      if (userHasManageRoleInResource(user, organization)) {
        return this.resourceRolesPipe.transform(resourceType);
      }
      return roles;
    }

    if (userIsManagerInWorkspace(user, organization, project)) {
      return this.resourceRolesPipe.transform(resourceType);
    }

    return roles;
  }
}
