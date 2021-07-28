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
import {Role} from '../../../core/store/permissions/permissions';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {teamRolesInOrganization, teamRolesInProject} from '../../utils/permission.utils';
import {Team} from '../../../core/store/teams/team';

@Pipe({
  name: 'teamTransitiveRoles',
})
export class TeamTransitiveRolesPipe implements PipeTransform {
  public transform(organization: Organization, project: Project, team: Team, resourceType: ResourceType): Role[] {
    switch (resourceType) {
      case ResourceType.Project: {
        return [
          ...teamRolesInOrganization(organization, team).filter(role => role.transitive),
          ...teamRolesInOrganization(organization, team)
            .filter(role => role.transitive)
            .map(role => ({
              ...role,
              transitive: false,
            })),
        ];
      }
      case ResourceType.View:
      case ResourceType.Collection: {
        return [
          ...teamRolesInProject(organization, project, team)
            .filter(role => role.transitive)
            .map(role => ({
              ...role,
              transitive: false,
            })),
        ];
      }
      default:
        return [];
    }
  }
}
