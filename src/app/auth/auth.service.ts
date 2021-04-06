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
import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {Auth0DecodedHash, Auth0UserProfile, WebAuth} from 'auth0-js';
import {Observable, of, Subject} from 'rxjs';
import {catchError, filter, map, mergeMap, tap} from 'rxjs/operators';
import {Angulartics2} from 'angulartics2';
import {User} from '../core/store/users/user';
import mixpanel from 'mixpanel-browser';
import {hashUserId} from '../shared/utils/system.utils';
import {HttpErrorResponse} from '@angular/common/http';
import {AppState} from '../core/store/app.state';
import {UsersAction} from '../core/store/users/users.action';
import {selectCurrentUser} from '../core/store/users/users.state';
import {select, Store} from '@ngrx/store';
import {UserActivityService} from './user-activity.service';
import {isNullOrUndefined} from '../shared/utils/common.utils';
import {UserService} from '../core/data-service';
import {ConfigurationService} from '../configuration/configuration.service';

const REDIRECT_KEY = 'auth_login_redirect';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const CHECK_INTERVAL = 3000; // millis
const RENEW_TOKEN_EXPIRATION = 10; // minutes
const RENEW_TOKEN_MINUTES = 4;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0: WebAuth;
  private loggingIn: boolean;

  private accessToken: string;
  private idToken: string;
  private expiresAt: number;

  private lastRenewedAt: number;
  private intervalId: number;

  public constructor(
    private location: Location,
    private router: Router,
    private userService: UserService,
    private activityService: UserActivityService,
    private store$: Store<AppState>,
    private angulartics2: Angulartics2,
    private ngZone: NgZone,
    private configurationService: ConfigurationService
  ) {
    if (this.configurationService.getConfiguration().auth) {
      const redirectUri = document.location.origin + location.prepareExternalUrl('auth');
      this.initAuth(redirectUri);

      // in case the application was refreshed and user has already been authenticated
      this.initInterval();
    }
  }

  private initAuth(redirectUri: string) {
    this.auth0 = new WebAuth({
      clientID: this.configurationService.getConfiguration().authClientId,
      domain: this.configurationService.getConfiguration().authDomain,
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
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }

    this.angulartics2.eventTrack.next({
      action: 'User login',
      properties: {category: 'User Actions'},
    });

    if (this.configurationService.getConfiguration().mixpanelKey) {
      mixpanel.track('User Login');
    }
  }

  public handleAuthentication() {
    this.auth0.parseHash((error, authResult) => {
      if (authResult?.accessToken && authResult?.idToken) {
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
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user)
      )
      .subscribe((user: User) => {
        const hoursSinceLastLogin: number = (+new Date() - +user.lastLoggedIn) / 1000 / 60 / 60;
        this.angulartics2.eventTrack.next({
          action: 'User returned',
          properties: {category: 'User Actions', label: 'hoursSinceLastLogin', value: hoursSinceLastLogin},
        });

        if (this.configurationService.getConfiguration().mixpanelKey) {
          mixpanel.identify(hashUserId(user.id));
          mixpanel.track('User Returned', {
            dau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24,
            wau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24 * 7,
            mau: hoursSinceLastLogin > 1 && hoursSinceLastLogin <= 24 * 30,
            hoursSinceLastLogin: hoursSinceLastLogin,
          });
        }
      });
  }

  private setSession(authResult: Auth0DecodedHash): void {
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    // Set the time that the access token will expire at
    this.expiresAt = new Date(authResult.expiresIn * 1000 + new Date().getTime()).getTime();

    if (this.configurationService.getConfiguration().authPersistence) {
      localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
      localStorage.setItem(ID_TOKEN_KEY, this.idToken);
      localStorage.setItem(EXPIRES_AT_KEY, String(this.expiresAt));
    }
  }

  public logout(): void {
    if (!this.configurationService.getConfiguration().auth) {
      console.warn('Cannot log out. Authentication is disabled.');
      return;
    }

    this.clearLoginData();
    window.location.assign(this.getLogoutUrl());
  }

  private clearLoginData() {
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = null;

    if (this.configurationService.getConfiguration().authPersistence) {
      // Remove tokens and expiry time from localStorage
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ID_TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
    }

    window.clearInterval(this.intervalId);
  }

  public getLogoutUrl(): string {
    const returnToUrl = encodeURIComponent(document.location.origin + this.location.prepareExternalUrl('logout'));
    return `https://${
      this.configurationService.getConfiguration().authDomain
    }/v2/logout?returnTo=${returnToUrl}&client_id=${this.configurationService.getConfiguration().authClientId}`;
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
    if (localStorage.getItem(EXPIRES_AT_KEY)) {
      return Number(localStorage.getItem(EXPIRES_AT_KEY));
    }
    return this.expiresAt;
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

  private tryRenewToken(): Observable<Auth0DecodedHash> {
    const subject = new Subject<Auth0DecodedHash>();
    this.auth0.checkSession({}, (error, result) => subject.next(error ? null : result));
    return subject.asObservable();
  }

  private initInterval() {
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        this.check();
      }, CHECK_INTERVAL);
    });
  }

  private check() {
    if (this.isAuthenticated()) {
      const expiresAt = this.getExpiresAt();
      const expiresInMinutes = (expiresAt - Date.now()) / 1000 / 60;
      const maximumInactivity = this.configurationService.getConfiguration().sessionTimeout / 2;
      if (
        expiresInMinutes > RENEW_TOKEN_EXPIRATION ||
        this.activityService.getLastActivityBeforeMinutes() > maximumInactivity
      ) {
        return;
      }

      const lastRenewedInMinutes = this.lastRenewedAt ? (Date.now() - this.lastRenewedAt) / 1000 / 60 : null;
      if (isNullOrUndefined(lastRenewedInMinutes) || lastRenewedInMinutes > RENEW_TOKEN_MINUTES) {
        this.lastRenewedAt = Date.now();
        this.ngZone.runOutsideAngular(() => {
          this.renewToken();
        });
      }
    } else {
      this.redirectOnUnauthorized();
    }
  }

  private redirectOnUnauthorized() {
    this.ngZone.run(() => {
      this.clearLoginData();
      this.navigateToSessionExpiredPage();
    });
  }

  private navigateToSessionExpiredPage() {
    if (!this.isPathOutsideApp(this.router.url)) {
      this.router.navigate(['/', 'session-expired'], {
        queryParams: {
          redirectUrl: this.router.url,
        },
      });
    }
  }

  public getAndClearLoginRedirectPath(): string {
    const redirectPath = localStorage.getItem(REDIRECT_KEY) || '/';
    localStorage.removeItem(REDIRECT_KEY);
    return redirectPath;
  }

  public saveLoginRedirectPath(redirectPath: string) {
    if (!this.isPathOutsideApp(redirectPath)) {
      localStorage.setItem(REDIRECT_KEY, redirectPath);
    }
  }

  public isPathOutsideApp(redirectPath: string): boolean {
    const restrictedPaths = ['/agreement', '/logout', '/auth', '/session-expired'];
    return restrictedPaths.some(path => {
      const pathWithOrigin = window.location.origin + this.location.prepareExternalUrl(path);
      return redirectPath.startsWith(path) || redirectPath.startsWith(pathWithOrigin);
    });
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
    return this.userService.checkAuthentication().pipe(
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
