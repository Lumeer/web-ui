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
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {Observable, of} from 'rxjs';
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';

import {AppState} from '../../store/app.state';
import {Organization} from '../../store/organizations/organization';
import {selectOrganizationByCode} from '../../store/organizations/organizations.state';
import {User} from '../../store/users/user';
import {UsersAction} from '../../store/users/users.action';
import {selectAllUsers, selectUsersLoadedForOrganization} from '../../store/users/users.state';

@Injectable()
export class UsersGuard {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User[]> {
    const organizationCode = route.paramMap.get('organizationCode');

    return this.store$.pipe(
      select(selectOrganizationByCode(organizationCode)),
      mergeMap(organization => {
        if (!organization) {
          return of([]);
        }
        return this.selectUsersForOrganization(organization);
      }),
      first()
    );
  }

  private selectUsersForOrganization(organization: Organization): Observable<User[]> {
    return this.store$.select(selectUsersLoadedForOrganization).pipe(
      tap(loadedOrganizationId => {
        if (loadedOrganizationId !== organization.id) {
          this.store$.dispatch(new UsersAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loadedOrganizationId => loadedOrganizationId !== organization.id),
      mergeMap(() => this.store$.pipe(select(selectAllUsers))),
      first()
    );
  }
}
