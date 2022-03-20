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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {catchError, map, mergeMap, take, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {userCanManageProjectUserDetail} from '../../shared/utils/permission.utils';
import {WorkspaceService} from '../../workspace/workspace.service';
import {User} from '../../core/store/users/user';
import {convertUserDtoToModel} from '../../core/store/users/user.converter';
import {UserService} from '../../core/data-service';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {selectCurrentUser} from '../../core/store/users/users.state';

@Injectable()
export class WorkspaceUserSettingsGuard implements CanActivate {
  public constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>,
    private userService: UserService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');
    const projectCodeQueryParam = next.queryParamMap.get('projectCode');
    const userId = next.paramMap.get('userId');

    return this.selectOrGetUserAndWorkspace(organizationCode, projectCode || projectCodeQueryParam).pipe(
      mergeMap(data => this.getUser(data, data.organization?.id, userId)),
      mergeMap(({user, organization, project, workspaceUser}) => {
        if (!organization) {
          const message = $localize`:@@organization.not.exist:Organization does not exist`;
          this.dispatchErrorActions(message);
          return of(false);
        }

        if (!project) {
          const message = $localize`:@@project.not.exist:Project does not exist`;
          this.dispatchErrorActions(message);
          return of(false);
        }

        if (!workspaceUser) {
          const message = $localize`:@@user.not.exist:User does not exist`;
          this.dispatchErrorActions(message);
          return of(false);
        }

        if (!userCanManageProjectUserDetail(organization, project, user)) {
          const message = $localize`:@@user.permission.missing:You do not have permission to access this user`;
          this.dispatchErrorActions(message);
          return of(false);
        }

        return this.workspaceService.switchWorkspace(organization, project).pipe(
          map(() => {
            if (projectCodeQueryParam === project.code) {
              return true;
            }
            return this.router.createUrlTree(
              next.url.map(segment => segment.path),
              {queryParams: {projectCode: project.code}}
            );
          })
        );
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private selectOrGetUserAndWorkspace(
    organizationCode: string,
    projectCode: string
  ): Observable<{user?: User; organization?: Organization; project?: Project}> {
    return this.workspaceService.selectOrGetUserAndOrganizationAndProjects(organizationCode).pipe(
      withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
      map(([{organization, projects, user}, currentUser]) => ({
        organization,
        user,
        project:
          projects?.find(project => project.code === projectCode) ||
          projects?.find(
            project =>
              project.id === currentUser?.defaultWorkspace?.projectId &&
              project.organizationId === currentUser?.defaultWorkspace?.organizationId
          ) ||
          projects?.[0],
      }))
    );
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  private getUser<T>(data: T, organizationId: string, userId: string): Observable<T & {workspaceUser?: User}> {
    if (organizationId) {
      return this.userService.getUser(organizationId, userId).pipe(
        map(dto => convertUserDtoToModel(dto)),
        catchError(() => of(undefined)),
        map(workspaceUser => ({...data, workspaceUser}))
      );
    }
    return of(data);
  }
}
