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
import {ResourceType} from '../../../../../core/model/resource-type';
import {Resource} from '../../../../../core/model/resource';
import {Role} from '../../../../../core/model/role';
import {Project} from '../../../../../core/store/projects/project';
import {superUserEmails} from '../../../../../auth/super-user-emails';
import {Organization} from '../../../../../core/store/organizations/organization';
import {User} from '../../../../../core/store/users/user';
import {userHasManageRoleInResource, userHasRoleInResource} from '../../../../utils/resource.utils';

@Pipe({
  name: 'canCreateResource',
})
export class CanCreateResourcePipe implements PipeTransform {
  public transform(resource: Resource, type: ResourceType, organizations: Organization[], currentUser: User): boolean {
    if (!resource) {
      return false;
    }

    if (type === ResourceType.Organization) {
      if (superUserEmails.includes(currentUser?.email)) {
        return true;
      }
      const hasManagedOrganization = organizations.some(organization =>
        userHasManageRoleInResource(currentUser, organization)
      );
      return !hasManagedOrganization;
    } else if (type === ResourceType.Project) {
      const project = resource as Project;
      const organization = organizations.find(org => org.id === project.organizationId);
      return userHasRoleInResource(currentUser, organization, Role.Write);
    }
    return true;
  }
}
