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

import {ResourceType} from '../../../../core/model/resource-type';
import {ResourceModel} from '../../../../core/model/resource.model';
import {of, Observable} from 'rxjs';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {map, mergeMap} from 'rxjs/operators';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {selectOrganizationById} from '../../../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../../../core/store/projects/project.model';
import {PermissionsPipe} from '../../../pipes/permissions.pipe';
import {Role} from '../../../../core/model/role';

const allowedEmails = ['support@lumeer.io', 'martin@vecerovi.com', 'kubedo8@gmail.com', 'livoratom@gmail.com'];

@Pipe({
  name: 'canCreateResource'
})
export class CanCreateResourcePipe implements PipeTransform {

  public constructor(private store: Store<AppState>,
                     private permissionsPipe: PermissionsPipe) {
  }

  public transform(resource: ResourceModel, type: ResourceType): Observable<boolean> {
    if (type === ResourceType.Organization) {
      return this.store.select(selectCurrentUser).pipe(
        map(user => allowedEmails.includes(user.email))
      );
    } else if (type === ResourceType.Project) {
      const project = resource as ProjectModel;
      return this.store.select(selectOrganizationById(project.organizationId)).pipe(
        mergeMap(organization => this.permissionsPipe.transform(organization, Role.Write))
      );
    }
    return of(true);
  }

}
