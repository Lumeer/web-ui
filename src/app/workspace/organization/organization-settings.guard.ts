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
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';

import {Store} from '@ngrx/store';

import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {Organization} from '../../core/store/organizations/organization';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {userCanManageOrganizationDetail} from '../../shared/utils/permission.utils';
import {WorkspaceService} from '../workspace.service';

@Injectable()
export class OrganizationSettingsGuard {
  public constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');

    return this.workspaceService.selectOrGetUserAndOrganization(organizationCode).pipe(
      map(({organization, user}) => {
        if (!organization) {
          this.dispatchErrorActionsNotExist();
          return false;
        }

        if (!userCanManageOrganizationDetail(organization, user)) {
          this.dispatchErrorActionsNotPermission();
          return false;
        }

        this.dispatchDataEvents(organization);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  private dispatchErrorActionsNotExist() {
    const message = $localize`:@@organization.not.exist:Organization does not exist`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = $localize`:@@organization.permission.missing:You do not have permission to access this organization`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  private dispatchDataEvents(organization: Organization) {
    this.store$.dispatch(new OrganizationsAction.GetOne({organizationId: organization.id}));
    this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
  }
}
