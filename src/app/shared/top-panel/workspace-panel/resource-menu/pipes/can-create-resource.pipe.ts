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

import {ConfigurationService} from '../../../../../configuration/configuration.service';
import {Resource} from '../../../../../core/model/resource';
import {ResourceType} from '../../../../../core/model/resource-type';
import {RoleType} from '../../../../../core/model/role-type';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {User} from '../../../../../core/store/users/user';
import {userHasRoleInOrganization} from '../../../../utils/permission.utils';

@Pipe({
  name: 'canCreateResource',
})
export class CanCreateResourcePipe implements PipeTransform {
  constructor(private configurationService: ConfigurationService) {}
  public transform(resource: Resource, type: ResourceType, organizations: Organization[], currentUser: User): boolean {
    if (!resource) {
      return false;
    }

    const adminUserEmails = this.configurationService.getConfiguration().adminUserEmails || [];
    if (type === ResourceType.Organization) {
      if (adminUserEmails.includes(currentUser?.email)) {
        return true;
      }
      const hasManagedOrganization = organizations.some(organization =>
        userHasRoleInOrganization(organization, currentUser, RoleType.Manage)
      );
      return !hasManagedOrganization;
    } else if (type === ResourceType.Project) {
      const project = resource as Project;
      const organization = organizations.find(org => org.id === project.organizationId);
      return userHasRoleInOrganization(organization, currentUser, RoleType.ProjectContribute);
    }
    return true;
  }
}
