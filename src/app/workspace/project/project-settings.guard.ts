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
import {catchError, mergeMap, take} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {WorkspaceService} from '../workspace.service';
import {userIsManagerInWorkspace} from '../../shared/utils/resource.utils';

@Injectable()
export class ProjectSettingsGuard implements CanActivate {
  public constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');

    return this.workspaceService.selectOrGetUserAndWorkspace(organizationCode, projectCode).pipe(
      mergeMap(({user, organization, project}) => {
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

        if (!userIsManagerInWorkspace(user, organization, project)) {
          this.dispatchErrorActionsNotPermission();
          return of(false);
        }

        return this.workspaceService.switchWorkspace(organization, project);
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private dispatchErrorActionsNotPermission() {
    const message = $localize`:@@project.permission.missing:You do not have permission to access this project`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }
}
