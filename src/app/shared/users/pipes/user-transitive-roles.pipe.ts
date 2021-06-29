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
import {ResourceType} from '../../../core/model/resource-type';
import {Permissions, Role} from '../../../core/store/permissions/permissions';
import {User} from '../../../core/store/users/user';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {userRolesInOrganization, userRolesInProject} from '../../utils/permission.utils';

@Pipe({
  name: 'userTransitiveRoles',
})
export class UserTransitiveRolesPipe implements PipeTransform {
  public transform(
    organization: Organization,
    project: Project,
    user: User,
    resourceType: ResourceType,
    permissions: Permissions
  ): Role[] {
    const userTeamIds = user.teams?.map(team => team.id);
    const userTeamsRoles = (permissions?.groups || []).reduce((roles, team) => {
      if (userTeamIds.includes(team.id)) {
        roles.push(...(team.roles || []));
      }
      return roles;
    }, []);

    switch (resourceType) {
      case ResourceType.Organization: {
        return userTeamsRoles;
      }
      case ResourceType.Project: {
        return [...userRolesInOrganization(organization, user), ...userTeamsRoles];
      }
      case ResourceType.View:
      case ResourceType.Collection: {
        return [
          ...userRolesInProject(organization, project, user).map(role => ({
            ...role,
            transitive: false,
          })),
          ...userTeamsRoles,
        ];
      }
    }
    return;
  }
}
