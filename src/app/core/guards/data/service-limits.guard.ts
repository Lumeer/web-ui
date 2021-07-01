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
import {Observable} from 'rxjs';
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {AppState} from '../../store/app.state';
import {
  selectAllServiceLimits,
  selectServiceLimitsLoaded,
} from '../../store/organizations/service-limits/service-limits.state';
import {ServiceLimits} from '../../store/organizations/service-limits/service.limits';
import {ServiceLimitsAction} from '../../store/organizations/service-limits/service-limits.action';

@Injectable()
export class ServiceLimitsGuard implements Resolve<ServiceLimits[]> {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ServiceLimits[]> {
    return this.store$.select(selectServiceLimitsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ServiceLimitsAction.GetAll());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllServiceLimits))),
      first()
    );
  }
}
