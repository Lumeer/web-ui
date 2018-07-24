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
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {first, map, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../../store/app.state';
import {OrganizationModel} from '../../store/organizations/organization.model';
import {OrganizationsAction} from '../../store/organizations/organizations.action';
import {selectAllOrganizations, selectOrganizationByCode, selectOrganizationsLoaded} from '../../store/organizations/organizations.state';

@Injectable()
export class OrganizationsGuard implements Resolve<OrganizationModel[]> {

  constructor(private i18n: I18n,
              private notificationService: NotificationService,
              private router: Router,
              private store$: Store<AppState>) {
  }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<OrganizationModel[]> {
    const organizationCode = route.paramMap.get('organizationCode');

    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
        }
      }),
      skipWhile(loaded => !loaded),
      first(),
      mergeMap(() => {
        if (!organizationCode) {
          return this.store$.select(selectAllOrganizations);
        }

        return this.store$.select(selectOrganizationByCode(organizationCode)).pipe(
          map(organization => {
            if (organization) {
              return [organization];
            }

            this.navigateToWorkspaceSelection();
            return [];
          })
        );
      }),
      first()
    );
  }

  private navigateToWorkspaceSelection() {
    this.router.navigate(['/', 'workspace']);

    const message = this.i18n({id: 'organization.not.exist', value: 'Organization does not exist'});
    this.notificationService.error(message);
  }

}
