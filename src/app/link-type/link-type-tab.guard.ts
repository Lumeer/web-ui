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
import {map, mergeMap, switchMap, take} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../core/store/app.state';
import {selectNavigation} from '../core/store/navigation/navigation.state';
import {WorkspaceService} from '../workspace/workspace.service';
import {Project} from '../core/store/projects/project';
import {User} from '../core/store/users/user';
import {Organization} from '../core/store/organizations/organization';
import {userRoleTypesInResource} from '../shared/utils/permission.utils';
import {RoleType} from '../core/model/role-type';
import {selectLinkTypeById} from '../core/store/link-types/link-types.state';
import {LinkType} from '../core/store/link-types/link.type';

@Injectable()
export class LinkTypeTabGuard implements CanActivateChild {
  constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    if (!next.data.role) {
      return of(true);
    }
    return this.selectUserAndResources().pipe(
      map(data => {
        const roleTypes = userRoleTypesInResource(data.organization, data.project, data.linkType, data.user);
        if (roleTypes.includes(next.data.role)) {
          return true;
        }

        const baseUrl = ['/o', data.organization?.code, 'p', data.project?.code, 'l', data.linkType.id];
        if (roleTypes.includes(RoleType.AttributeEdit)) {
          return this.router.createUrlTree([...baseUrl, 'attributes']);
        }
        if (roleTypes.includes(RoleType.TechConfig)) {
          return this.router.createUrlTree([...baseUrl, 'rules']);
        }
        if (roleTypes.includes(RoleType.Manage)) {
          return this.router.createUrlTree([...baseUrl, 'activity']);
        }

        return false;
      })
    );
  }

  private selectUserAndResources(): Observable<{
    user?: User;
    organization?: Organization;
    project?: Project;
    linkType: LinkType;
  }> {
    return this.store$.pipe(
      select(selectNavigation),
      map(navigation => navigation.navigatingWorkspace),
      take(1),
      switchMap(workspace =>
        this.workspaceService.selectOrGetUserAndWorkspace(workspace?.organizationCode, workspace?.projectCode).pipe(
          mergeMap(data =>
            this.store$.pipe(
              select(selectLinkTypeById(workspace?.linkTypeId)),
              map(linkType => ({
                ...data,
                linkType,
              }))
            )
          )
        )
      ),
      take(1)
    );
  }
}
