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
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';

import {Store, select} from '@ngrx/store';

import Cookies from 'js-cookie';
import mixpanel from 'mixpanel-browser';
import {Observable, of} from 'rxjs';
import {catchError, filter, first, map, mergeMap, tap} from 'rxjs/operators';

import {isNotNullOrUndefined, isNullOrUndefined} from '@lumeer/utils';

import {AuthService} from '../../auth/auth.service';
import {ConfigurationService} from '../../configuration/configuration.service';
import {idToReference} from '../../shared/utils/string.utils';
import {hashUserId} from '../../shared/utils/system.utils';
import {LUMEER_REFERRAL} from '../constants';
import {AppState} from '../store/app.state';
import {User} from '../store/users/user';
import {UsersAction} from '../store/users/users.action';
import {selectCurrentUser} from '../store/users/users.state';

@Injectable()
export class CurrentUserGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {}

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
    return this.authService.isAuthenticated$().pipe(
      mergeMap(authenticated => (authenticated ? this.selectCurrentUser$() : of(null))),
      filter(currentUser => isNotNullOrUndefined(currentUser)),
      first(),
      map(user => {
        if (!user.referral) {
          const referral = Cookies.get(LUMEER_REFERRAL);
          if (referral && idToReference(user.id) !== referral) {
            // do not refer myself
            this.store$.dispatch(new UsersAction.PatchCurrentUser({user: {...user, referral}}));
          }
        }

        if (!user.agreement) {
          this.authService.saveLoginRedirectPath(state.url);
          this.router.navigate(['/', 'agreement']);

          if (
            this.configurationService.getConfiguration().analytics &&
            this.configurationService.getConfiguration().mixpanelKey
          ) {
            const userHash = hashUserId(user.id);
            mixpanel.alias(userHash);
            mixpanel.identify(userHash);
          }
        } else {
          if (
            this.configurationService.getConfiguration().analytics &&
            this.configurationService.getConfiguration().mixpanelKey
          ) {
            const userHash = hashUserId(user.id);
            mixpanel.identify(userHash);
          }
        }

        return user.agreement;
      })
    );
  }

  private selectCurrentUser$(): Observable<User> {
    return this.store$.pipe(
      select(selectCurrentUser),
      tap(currentUser => {
        if (isNullOrUndefined(currentUser)) {
          this.store$.dispatch(new UsersAction.GetCurrentUser());
        }
      })
    );
  }
}
