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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree} from '@angular/router';

import {Observable, of} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {userRoleTypesInProject} from '../../shared/utils/permission.utils';
import {WorkspaceService} from '../workspace.service';
import {AppState} from '../../core/store/app.state';
import {RoleType} from '../../core/model/role-type';
import {User} from '../../core/store/users/user';
import {Organization} from '../../core/store/organizations/organization';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {Project} from '../../core/store/projects/project';

@Injectable()
export class ProjectTabGuard implements CanActivateChild {
  constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    if (!next.data?.role) {
      return of(true);
    }
    return this.selectUserAndResources().pipe(
      map(data => {
        const roleTypes = userRoleTypesInProject(data.organization, data.project, data.user);
        if (roleTypes.includes(next.data.role)) {
          return true;
        }

        const baseUrl = ['/o', data.organization?.code, 'p', data.project?.code];
        if (roleTypes.includes(RoleType.UserConfig)) {
          return this.router.createUrlTree([...baseUrl, 'users']);
        } else if (roleTypes.includes(RoleType.TechConfig)) {
          return this.router.createUrlTree([...baseUrl, 'sequences']);
        } else if (roleTypes.includes(RoleType.Manage)) {
          return this.router.createUrlTree([...baseUrl, 'activity']);
        }
        return false;
      })
    );
  }

  private selectUserAndResources(): Observable<{user?: User; organization?: Organization; project?: Project}> {
    return this.store$.pipe(
      select(selectNavigation),
      map(navigation => navigation.navigatingWorkspace),
      take(1),
      switchMap(workspace =>
        this.workspaceService.selectOrGetUserAndWorkspace(workspace?.organizationCode, workspace?.projectCode)
      ),
      take(1)
    );
  }
}
