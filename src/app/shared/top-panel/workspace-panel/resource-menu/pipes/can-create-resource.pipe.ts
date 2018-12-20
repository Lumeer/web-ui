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

import {Pipe, PipeTransform} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {filter, map, mergeMap} from 'rxjs/operators';
import {ResourceType} from '../../../../../core/model/resource-type';
import {Resource} from '../../../../../core/model/resource';
import {Role} from '../../../../../core/model/role';
import {AppState} from '../../../../../core/store/app.state';
import {selectOrganizationById} from '../../../../../core/store/organizations/organizations.state';
import {selectServiceLimitsByOrganizationId} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {Project} from '../../../../../core/store/projects/project';
import {selectCurrentUser} from '../../../../../core/store/users/users.state';
import {PermissionsPipe} from '../../../../pipes/permissions/permissions.pipe';

const allowedEmails = ['support@lumeer.io', 'martin@vecerovi.com', 'kubedo8@gmail.com', 'livoratom@gmail.com'];

@Pipe({
  name: 'canCreateResource',
})
export class CanCreateResourcePipe implements PipeTransform {
  public constructor(private store$: Store<AppState>, private permissionsPipe: PermissionsPipe) {}

  public transform(resource: Resource, type: ResourceType, projects: Project[]): Observable<boolean> {
    if (!resource) {
      return of(false);
    }

    if (type === ResourceType.Organization) {
      return this.store$.pipe(
        select(selectCurrentUser),
        map(user => allowedEmails.includes(user.email))
      );
    } else if (type === ResourceType.Project) {
      const project = resource as Project;
      return combineLatest(
        this.store$.pipe(select(selectOrganizationById(project.organizationId))),
        this.store$.pipe(select(selectServiceLimitsByOrganizationId(project.organizationId)))
      ).pipe(
        filter(([organization, serviceLimits]) => !!organization && !!serviceLimits),
        mergeMap(([organization, serviceLimits]) =>
          this.permissionsPipe
            .transform(organization, type, Role.Write)
            .pipe(map(allowed => allowed && projects.length < serviceLimits.projects))
        )
      );
    }
    return of(true);
  }
}
