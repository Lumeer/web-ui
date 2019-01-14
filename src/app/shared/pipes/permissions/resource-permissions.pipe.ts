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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {Resource} from '../../../core/model/resource';
import {AppState} from '../../../core/store/app.state';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {userHasManageRoleInResource, userIsManagerInWorkspace, userRolesInResource} from '../../utils/resource.utils';
import {selectWorkspaceModels} from '../../../core/store/common/common.selectors';
import {ResourceType} from '../../../core/model/resource-type';
import {User} from '../../../core/store/users/user';
import {allRoles, Role} from '../../../core/model/role';

@Pipe({
  name: 'resourcePermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class ResourcePermissionsPipe implements PipeTransform {
  public constructor(private store$: Store<AppState>) {}

  public transform(
    resource: Resource,
    type: ResourceType
  ): Observable<{read: boolean; write: boolean; manage: boolean; clone: boolean; share: boolean; comment: boolean}> {
    return this.store$.pipe(
      select(selectCurrentUserForWorkspace),
      mergeMap(user => this.getWorkspaceRoles(type, user).pipe(map(roles => ({user, roles})))),
      map(({roles, user}) => {
        const resourceRoles = userRolesInResource(user, resource).concat(roles);
        return {
          read: resourceRoles.includes(Role.Read),
          write: resourceRoles.includes(Role.Write),
          manage: resourceRoles.includes(Role.Manage),
          clone: resourceRoles.includes(Role.Clone),
          share: resourceRoles.includes(Role.Share),
          comment: resourceRoles.includes(Role.Comment),
        };
      })
    );
  }

  private getWorkspaceRoles(type: ResourceType, user: User): Observable<string[]> {
    if (type === ResourceType.Organization) {
      return of([]);
    }
    return this.store$.pipe(
      select(selectWorkspaceModels),
      map(models => ({organization: models.organization, project: models.project})),
      map(({organization, project}) => {
        if (type === ResourceType.Project) {
          return (userHasManageRoleInResource(user, organization) && allRoles) || [];
        }
        return (userIsManagerInWorkspace(user, organization, project) && allRoles) || [];
      }),
      map(roles => roles.map(role => role.toString().toUpperCase()))
    );
  }
}
