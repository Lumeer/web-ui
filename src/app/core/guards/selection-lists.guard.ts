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
import {AppState} from '../store/app.state';
import {select, Store} from '@ngrx/store';
import {selectOrganizationByCode} from '../store/organizations/organizations.state';
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {Organization} from '../store/organizations/organization';
import {SelectionList} from '../../shared/lists/selection/selection-list';
import {SelectionListsAction} from '../store/selection-lists/selection-lists.action';
import {
  selectSelectionListsByOrganizationSorted,
  selectSelectionListsLoaded,
} from '../store/selection-lists/selection-lists.state';

@Injectable()
export class SelectionListsGuard implements Resolve<SelectionList[]> {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SelectionList[]> {
    const organizationCode = route.paramMap.get('organizationCode');

    return this.store$.pipe(
      select(selectOrganizationByCode(organizationCode)),
      mergeMap(organization => {
        if (!organization) {
          return of([]);
        }
        return this.selectSelectionListsForOrganization(organization);
      }),
      first()
    );
  }

  private selectSelectionListsForOrganization(organization: Organization): Observable<SelectionList[]> {
    return this.store$.select(selectSelectionListsLoaded(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new SelectionListsAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectSelectionListsByOrganizationSorted(organization.id)))),
      first()
    );
  }
}
