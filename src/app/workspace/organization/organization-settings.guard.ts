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

import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {filter, mergeMap, take, withLatestFrom} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {UsersAction} from '../../core/store/users/users.action';
import {WorkspaceService} from '../workspace.service';
import {userHasManageRoleInResource} from '../../shared/utils/resource.utils';
import {selectCurrentUserForWorkspace} from '../../core/store/users/users.state';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';

@Injectable()
export class OrganizationSettingsGuard implements CanActivate {

  public constructor(private i18n: I18n,
                     private router: Router,
                     private workspaceService: WorkspaceService,
                     private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {

    const organizationCode = next.paramMap.get('organizationCode');

    return Observable.combineLatest(
      this.workspaceService.getOrganizationFromStoreOrApi(organizationCode),
      this.store.select(selectCurrentUserForWorkspace)
    ).pipe(
      filter(([organization, user]) => !isNullOrUndefined(user)),
      take(1),
      mergeMap(([organization, user]) => {
        if (isNullOrUndefined(organization)) {
          this.dispatchErrorActionsNotExist();
          return Observable.of(false);
        }

        if (!userHasManageRoleInResource(user, organization)) {
          this.dispatchErrorActionsNotPermission();
          return Observable.of(false);
        }
        this.dispatchDataEvents(organization);
        return Observable.of(true);
      })
    );
  }

  private dispatchErrorActionsNotExist() {
    const message = this.i18n({id: 'organization.not.exist', value: 'Organization does not exist'});
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = this.i18n({
      id: 'organization.permission.missing',
      value: 'You do not have permission to access this organization'
    });
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/workspace']);
    this.store.dispatch(new NotificationsAction.Error({message}));
  }

  private dispatchDataEvents(organization: OrganizationModel) {
    this.store.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
    this.store.dispatch(new UsersAction.Get({organizationId: organization.id}));
    //this.store.dispatch(new GroupsAction.Get());
  }
}
