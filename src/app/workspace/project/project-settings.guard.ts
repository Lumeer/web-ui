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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, take} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {Organization} from '../../core/store/organizations/organization';
import {WorkspaceService} from '../workspace.service';
import {userIsManagerInWorkspace} from '../../shared/utils/resource.utils';
import {selectCurrentUserForWorkspace} from '../../core/store/users/users.state';
import {isNullOrUndefined} from '../../shared/utils/common.utils';

@Injectable()
export class ProjectSettingsGuard implements CanActivate {
  public constructor(
    private i18n: I18n,
    private router: Router,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');

    return this.workspaceService.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization => {
        if (isNullOrUndefined(organization)) {
          this.dispatchErrorActionsNotExist();
          return of(false);
        }
        return this.checkProject(organization, projectCode);
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private checkProject(organization: Organization, projectCode: string): Observable<boolean> {
    return combineLatest(
      this.workspaceService.getProjectFromStoreOrApi(organization.code, organization.id, projectCode),
      this.store$.pipe(select(selectCurrentUserForWorkspace))
    ).pipe(
      filter(([project, user]) => !isNullOrUndefined(user)),
      take(1),
      map(([project, user]) => {
        if (isNullOrUndefined(project)) {
          this.dispatchErrorActionsNotExist();
          return false;
        }

        if (!userIsManagerInWorkspace(user, organization, project)) {
          this.dispatchErrorActionsNotPermission();
          return false;
        }
        return true;
      })
    );
  }

  private dispatchErrorActionsNotExist() {
    const message = this.i18n({id: 'project.not.exist', value: 'Project does not exist'});
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = this.i18n({
      id: 'project.permission.missing',
      value: 'You do not have permission to access this project',
    });
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }
}
