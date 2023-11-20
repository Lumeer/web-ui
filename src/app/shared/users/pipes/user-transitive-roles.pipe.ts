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
import {Pipe, PipeTransform} from '@angular/core';

import {ResourcePermissionType, resourcePermissionTypeLinkedTypes} from '../../../core/model/resource-permission-type';
import {Organization} from '../../../core/store/organizations/organization';
import {Permissions, Role} from '../../../core/store/permissions/permissions';
import {Project} from '../../../core/store/projects/project';
import {User} from '../../../core/store/users/user';
import {View} from '../../../core/store/views/view';
import {userTransitiveRoles} from '../../utils/permission.utils';

@Pipe({
  name: 'userTransitiveRoles',
})
export class UserTransitiveRolesPipe implements PipeTransform {
  public transform(
    organization: Organization,
    project: Project,
    user: User,
    resourceType: ResourcePermissionType,
    permissionsMap: Record<ResourcePermissionType, Permissions>,
    viewsMap?: Record<ResourcePermissionType, View>
  ): Record<ResourcePermissionType, Role[]> {
    return resourcePermissionTypeLinkedTypes(resourceType).reduce(
      (map, type) => ({
        ...map,
        [type]: userTransitiveRoles(organization, project, user, type, permissionsMap[type], viewsMap?.[type]),
      }),
      {} as Record<ResourcePermissionType, Role[]>
    );
  }
}
