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
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';
import {tap, filter, take, switchMap, catchError, map} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {selectCurrentUserForWorkspace} from '../store/users/users.state';
import {UsersAction} from '../store/users/users.action';
import {isNullOrUndefined} from 'util';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {
    return this.checkStore().pipe(
      catchError(() => of(false))
    );
  }

  private checkStore(): Observable<boolean> {
    return this.store.select(selectCurrentUserForWorkspace).pipe(
      tap(currentUser => {
        if (isNullOrUndefined(currentUser)) {
          this.store.dispatch(new UsersAction.GetCurrentUser());
        }
      }),
      filter(currentUser => !isNullOrUndefined(currentUser)),
      take(1),
      map(() => true)
    );
  }
}
