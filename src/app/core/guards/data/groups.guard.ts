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
import {ActivatedRouteSnapshot, RouterStateSnapshot, Resolve} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AppState} from '../../store/app.state';
import {select, Store} from '@ngrx/store';
import {selectOrganizationByCode} from '../../store/organizations/organizations.state';
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {Organization} from '../../store/organizations/organization';
import {selectTeamsByOrganization, selectTeamsLoadedForOrganization} from '../../store/teams/teams.state';
import {TeamsAction} from '../../store/teams/teams.action';
import {Team} from '../../store/teams/team';

@Injectable()
export class GroupsGuard implements Resolve<Team[]> {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Team[]> {
    const organizationCode = route.paramMap.get('organizationCode');

    return this.store$.pipe(
      select(selectOrganizationByCode(organizationCode)),
      mergeMap(organization => {
        if (!organization) {
          return of([]);
        }
        return this.selectGroupsForOrganization(organization);
      }),
      first()
    );
  }

  private selectGroupsForOrganization(organization: Organization): Observable<Team[]> {
    return this.store$.select(selectTeamsLoadedForOrganization(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new TeamsAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectTeamsByOrganization(organization.id)))),
      first()
    );
  }
}
