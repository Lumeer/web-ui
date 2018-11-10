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
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {catchError, filter, first, map, tap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AuthService} from '../../auth/auth.service';
import {AppState} from '../store/app.state';
import {UsersAction} from '../store/users/users.action';
import {selectCurrentUserForWorkspace} from '../store/users/users.state';

@Injectable()
export class CurrentUserGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router, private store: Store<AppState>) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.isCurrentUserLoaded(state);
  }

  public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.isCurrentUserLoaded(state);
  }

  private isCurrentUserLoaded(state: RouterStateSnapshot): Observable<boolean> {
    return this.checkStore(state).pipe(
      catchError((err, caught) => {
        console.error(err);
        console.error(caught);
        return of(false);
      })
    );
  }

  private checkStore(state: RouterStateSnapshot): Observable<boolean> {
    return this.store.select(selectCurrentUserForWorkspace).pipe(
      tap(currentUser => {
        if (isNullOrUndefined(currentUser)) {
          this.store.dispatch(new UsersAction.GetCurrentUser());
        }
      }),
      filter(currentUser => !isNullOrUndefined(currentUser)),
      first(),
      map(user => {
        if (!user.agreement) {
          this.authService.saveLoginRedirectPath(state.url);
          this.router.navigate(['/', 'agreement']);
        }

        return user.agreement;
      })
    );
  }
}
