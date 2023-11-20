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

import {Observable} from 'rxjs';
import {filter, first, switchMap, tap} from 'rxjs/operators';

import {AppState} from '../../store/app.state';
import {Organization} from '../../store/organizations/organization';
import {OrganizationsAction} from '../../store/organizations/organizations.action';
import {selectAllOrganizations, selectOrganizationsLoaded} from '../../store/organizations/organizations.state';
import {PublicDataAction} from '../../store/public-data/public-data.action';

@Injectable()
export class OrganizationsProjectsGuard {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Organization[]> {
    this.initPublicData(route);

    return this.getOrganizations().pipe(first());
  }

  private initPublicData(route: ActivatedRouteSnapshot) {
    const organizationId = route.queryParams['o'];
    const projectId = route.queryParams['p'];

    if (organizationId && projectId) {
      this.store$.dispatch(
        new PublicDataAction.InitData({
          organizationId,
          projectId,
          viewCode: route.queryParams['v'],
          showTopPanel: route.queryParams['tp'] && JSON.parse(route.queryParams['tp']),
        })
      );
    }
  }

  private getOrganizations(): Observable<Organization[]> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.GetAllWorkspaces({}));
        }
      }),
      filter(loaded => loaded),
      switchMap(() => this.store$.pipe(select(selectAllOrganizations)))
    );
  }
}
