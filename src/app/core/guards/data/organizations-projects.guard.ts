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
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {filter, first, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from '../../store/app.state';
import {Organization} from '../../store/organizations/organization';
import {ProjectsAction} from '../../store/projects/projects.action';
import {TeamsAction} from '../../store/teams/teams.action';
import {selectProjectsLoaded} from '../../store/projects/projects.state';
import {selectTeamsLoaded} from '../../store/teams/teams.state';
import {selectAllOrganizations, selectOrganizationsLoaded} from '../../store/organizations/organizations.state';
import {OrganizationsAction} from '../../store/organizations/organizations.action';

@Injectable()
export class OrganizationsProjectsGuard implements Resolve<Organization[]> {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Organization[]> {
    return combineLatest([
      this.getOrganizations().pipe(
        tap(organizations =>
          organizations.forEach(org => {
            this.store$.dispatch(new ProjectsAction.Get({organizationId: org.id}));
            this.store$.dispatch(new TeamsAction.Get({organizationId: org.id}));
          })
        )
      ),
      this.store$.pipe(select(selectProjectsLoaded)),
      this.store$.pipe(select(selectTeamsLoaded)),
    ]).pipe(
      filter(([organizations, projectsLoaded, teamsLoaded]) =>
        organizations.every(org => projectsLoaded[org.id] && teamsLoaded[org.id])
      ),
      map(([organizations]) => organizations),
      first()
    );
  }

  private getOrganizations(): Observable<Organization[]> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
          this.store$.dispatch(new OrganizationsAction.GetCodes());
        }
      }),
      filter(loaded => loaded),
      switchMap(() => this.store$.pipe(select(selectAllOrganizations)))
    );
  }
}
