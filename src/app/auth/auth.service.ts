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

import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Auth0DecodedHash, Auth0UserProfile, WebAuth} from 'auth0-js';
import {Observable, of, Subject, Subscription, timer} from 'rxjs';
import {catchError, filter, map, mergeMap, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {Angulartics2} from 'angulartics2';
import {User} from '../core/store/users/user';
import mixpanel from 'mixpanel-browser';
import {hashUserId} from '../shared/utils/system.utils';
import {UserService} from '../core/rest';
import {HttpErrorResponse} from '@angular/common/http';
import {AppState} from '../core/store/app.state';
import {UsersAction} from '../core/store/users/users.action';
import {selectCurrentUser} from '../core/store/users/users.state';
import {select, Store} from '@ngrx/store';

const REDIRECT_KEY = 'auth_login_redirect';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const EXPIRES_AT_KEY = 'auth_expires_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0: WebAuth;
  private loggingIn: boolean;

  private accessToken: string;
  private idToken: string;
  private expiresAt: number;
  private userInteracted: boolean;

  private refreshSubscription: Subscription;
  private logoutSubscription: Subscription;

  public constructor(
    private location: Location,
    private router: Router,
    private userService: UserService,
    private store$: Store<AppState>,
    private angulartics2: Angulartics2
  ) {
    if (environment.auth) {
      const redirectUri = document.location.origin + location.prepareExternalUrl('auth');
      this.initAuth(redirectUri);

      // in case the application was refreshed and user has already been authenticated
      this.scheduleRenewal();
      this.scheduleLogout();
    }
  }

  private initAuth(redirectUri: string) {
    this.auth0 = new WebAuth({
      clientID: environment.authClientId,
      domain: environment.authDomain,
      responseType: 'token id_token',
      audience: document.location.origin.replace(':7000', ':8080') + '/',
      redirectUri,
      scope: 'openid profile email',
    });
  }

  public login(redirectPath: string): void {
    if (this.loggingIn) {
      return;
    }

    this.loggingIn = true;
    this.clearLoginData();
    this.saveLoginRedirectPath(redirectPath);
    this.auth0.authorize();
    this.trackUserLogin();
  }

  private trackUserLogin() {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2.eventTrack.next({
      action: 'User login',
      properties: {category: 'User Actions'},
    });

    if (environment.mixpanelKey) {
      mixpanel.track('User Login');
    }
  }

  public handleAuthentication() {
    this.auth0.parseHash((error, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        this.store$.dispatch(new UsersAction.GetCurrentUserWithLastLogin());
        this.trackUserLastLogin();
      } else if (error) {
        this.router.navigate(['/']);
        console.error(error);
      }
    });
  }

  private trackUserLastLogin() {
    if (!environment.analytics) {
      return;
    }
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user)
      )
      .subscribe((user: User) => {
        if (user) {
          const hoursSinceLastLogin: number = (+new Date() - +user.lastLoggedIn) / 1000 / 60 / 60;
          this.angulartics2.eventTrack.next({
            action: 'User returned',
            properties: {category: 'User Actions', label: 'hoursSinceLastLogin', value: hoursSinceLastLogin},
          });

          if (environment.mixpanelKey) {
            mixpanel.identify(hashUserId(user.id));
            mixpanel.track('User Returned', {
              dau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24,
              wau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24 * 7,
              mau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24 * 30,
              hoursSinceLastLogin: hoursSinceLastLogin,
            });
          }
        }
      });
  }

  private setSession(authResult: Auth0DecodedHash): void {
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    // Set the time that the access token will expire at
    this.expiresAt = new Date(authResult.expiresIn * 1000 + new Date().getTime()).getTime();

    if (environment.authPersistence) {
      localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
      localStorage.setItem(ID_TOKEN_KEY, this.idToken);
      localStorage.setItem(EXPIRES_AT_KEY, String(this.expiresAt));
    }

    this.scheduleRenewal();
    this.scheduleLogout();
  }

  public logout(): void {
    if (!environment.auth) {
      console.warn('Cannot log out. Authentication is disabled.');
      return;
    }

    this.clearLoginData();
    this.saveLoginRedirectPath(this.router.url);
    window.location.assign(this.getLogoutUrl());
  }

  private clearLoginData() {
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = null;

    if (environment.authPersistence) {
      // Remove tokens and expiry time from localStorage
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ID_TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
    }

    this.unscheduleRenewal();
  }

  public getLogoutUrl(): string {
    const returnToUrl = encodeURIComponent(document.location.origin + this.location.prepareExternalUrl('logout'));
    return `https://${environment.authDomain}/v2/logout?returnTo=${returnToUrl}&client_id=${environment.authClientId}`;
  }

  public isAuthenticated(): boolean {
    // Check whether the current time is past the access token's expiry time
    return new Date().getTime() < this.getExpiresAt();
  }

  public tokenExpired(): boolean {
    const expiredAt = this.getExpiresAt();
    return expiredAt > 0 && expiredAt < new Date().getTime();
  }

  public getAccessToken(): string {
    return this.accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getIdToken(): string {
    return this.idToken || localStorage.getItem(ID_TOKEN_KEY);
  }

  public getExpiresAt(): number {
    return this.expiresAt || Number(localStorage.getItem(EXPIRES_AT_KEY));
  }

  public getUserProfile(): Promise<Auth0UserProfile> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('Access token must exist to fetch profile');
    }

    return new Promise((resolve, reject) => {
      this.auth0.client.userInfo(accessToken, (error, profile) => {
        if (error) {
          reject(error);
        } else {
          resolve(profile);
        }
      });
    });
  }

  public renewToken() {
    this.auth0.checkSession({}, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        this.setSession(result);
      }
    });
  }

  public onUserInteraction() {
    this.userInteracted = true;
  }

  private tryRenewToken(): Observable<Auth0DecodedHash> {
    const subject = new Subject<Auth0DecodedHash>();
    this.auth0.checkSession({}, (error, result) => subject.next(error ? null : result));
    return subject.asObservable();
  }

  public scheduleRenewal() {
    if (!this.isAuthenticated()) {
      return;
    }

    this.unscheduleRenewal();
    this.userInteracted = false;

    const source = of(this.getExpiresAt()).pipe(
      mergeMap(expiresAt => {
        // Use the delay in a timer to run the refresh at the proper time
        const timerTime = (expiresAt - Date.now()) / 5;
        return timer(timerTime > 10000 ? timerTime : 20000);
      })
    );

    // Once the delay time from above is reached, get a new JWT and schedule additional refreshes
    this.refreshSubscription = source.subscribe(() => {
      if (this.userInteracted) {
        this.renewToken();
      } else {
        this.scheduleRenewal();
      }
    });
  }

  public unscheduleRenewal() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  public scheduleLogout() {
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
    this.logoutSubscription = timer(this.getExpiresAt() - Date.now()).subscribe(() => {
      this.login(this.router.url);
    });
  }

  public getLoginRedirectPath(): string {
    return localStorage.getItem(REDIRECT_KEY) || '/';
  }

  public saveLoginRedirectPath(redirectPath: string) {
    const restrictedPaths = ['/agreement', '/logout', '/auth'];
    if (!restrictedPaths.some(path => path.startsWith(redirectPath))) {
      localStorage.setItem(REDIRECT_KEY, redirectPath);
    }
  }

  public checkToken(): Observable<boolean> {
    return this.checkServerResponse().pipe(
      mergeMap(success => {
        if (success) {
          return this.tryRenewToken().pipe(
            tap(response => response && this.setSession(response)),
            map(response => !!response)
          );
        }
        return of(false);
      })
    );
  }

  private checkServerResponse(): Observable<boolean> {
    return this.userService.getCurrentUser().pipe(
      map(() => true),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return of(false);
        }
        return of(true);
      })
    );
  }
}
