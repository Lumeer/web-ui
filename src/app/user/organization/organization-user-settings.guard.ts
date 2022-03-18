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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {userCanManageOrganizationUserDetail} from '../../shared/utils/permission.utils';
import {WorkspaceService} from '../../workspace/workspace.service';
import {User} from '../../core/store/users/user';
import {convertUserDtoToModel} from '../../core/store/users/user.converter';
import {UserService} from '../../core/data-service';

@Injectable()
export class OrganizationUserSettingsGuard implements CanActivate {
  public constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>,
    private userService: UserService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const userId = next.paramMap.get('userId');

    return this.workspaceService.selectOrGetUserAndOrganization(organizationCode).pipe(
      mergeMap(data => this.getUser(data, data.organization?.id, userId)),
      map(({organization, user, workspaceUser}) => {
        if (!organization) {
          const message = $localize`:@@organization.not.exist:Organization does not exist`;
          this.dispatchErrorActions(message);
          return false;
        }

        if (!workspaceUser) {
          const message = $localize`:@@user.not.exist:User does not exist`;
          this.dispatchErrorActions(message);
          return false;
        }

        if (!userCanManageOrganizationUserDetail(organization, user)) {
          const message = $localize`:@@user.permission.missing:You do not have permission to access this user`;
          this.dispatchErrorActions(message);
          return false;
        }

        return true;
      }),
      catchError(() => of(false))
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
