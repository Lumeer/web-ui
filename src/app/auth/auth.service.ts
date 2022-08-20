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
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {WebAuth} from 'auth0-js';
import {BehaviorSubject, interval, Observable, of, share, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {Angulartics2} from 'angulartics2';
import {User} from '../core/store/users/user';
import mixpanel from 'mixpanel-browser';
import {hashUserId} from '../shared/utils/system.utils';
import {AppState} from '../core/store/app.state';
import {selectCurrentUser} from '../core/store/users/users.state';
import {select, Store} from '@ngrx/store';
import {UserActivityService} from './user-activity.service';
import {isNullOrUndefined} from '../shared/utils/common.utils';
import {UserService} from '../core/data-service';
import {ConfigurationService} from '../configuration/configuration.service';
import {createLanguageUrl, languageCodeMap} from '../core/model/language';
import {UsersAction} from '../core/store/users/users.action';
import Cookies from 'js-cookie';
import {SessionType} from './common/session-type';
import * as moment from 'moment';

const REDIRECT_KEY = 'auth_login_redirect';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const SESSION_HANDLING_KEY = 'auth_session_handling';
const CHECK_INTERVAL = 5000; // millis
const RENEW_TOKEN_EXPIRATION = 10; // minutes
const RENEW_TOKEN_MINUTES = 4;
const REFRESH_TOKEN_MINUTES = 2;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0: WebAuth;
  private loggingIn: boolean;
  private refreshing: boolean;

  private accessToken: string;
  private expiresAt: number;

  private lastRenewedAt: number;
  private intervalId: number;

  private activeRefresh$: Observable<AuthResult>;
  private accessToken$ = new BehaviorSubject<string>(localStorage.getItem(ACCESS_TOKEN_KEY));

  public constructor(
    private location: Location,
    private router: Router,
    private userService: UserService,
    private activityService: UserActivityService,
    private store$: Store<AppState>,
    private angulartics2: Angulartics2,
    private ngZone: NgZone,
    private configurationService: ConfigurationService,
    private httpClient: HttpClient
  ) {
    if (this.configurationService.getConfiguration().auth) {
      this.initAuth();

      // in case the application was refreshed and user has already been authenticated
      this.initInterval();
    }
  }

  private initAuth() {
    const redirectUri = document.location.origin + this.location.prepareExternalUrl('auth');
    this.auth0 = new WebAuth({
      clientID: this.configurationService.getConfiguration().authClientId,
      domain: this.configurationService.getConfiguration().authDomain,
      responseType: 'token id_token',
      audience: document.location.origin.replace(':7000', ':8080') + '/',
      redirectUri,
      scope: 'openid profile email offline_access',
    });
  }

  public setSessionType(method: SessionType, code: string) {
    const expires = moment().add(6, 'months').toDate();
    Cookies.set(SESSION_HANDLING_KEY, method, {expires});

    this.handleAuthenticationCode(code);
  }

  private getSessionType(): SessionType {
    return <SessionType>Cookies.get(SESSION_HANDLING_KEY);
  }

  private shouldSaveRefreshToken(): boolean {
    return this.getSessionType() === SessionType.StayLoggedIn;
  }

  public shouldShowSessionType(): boolean {
    return !this.getSessionType() || this.getSessionType() === SessionType.AskAgain;
  }

  public login(redirectPath: string) {
    if (this.loggingIn) {
      return;
    }

    this.loggingIn = true;
    this.clearLoginData();
    this.saveLoginRedirectPath(redirectPath);
    this.auth0.authorize({responseType: 'code'});
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

  public onAuthenticated(code: string) {
    if (this.shouldShowSessionType()) {
      this.router.navigate(['/', 'session'], {queryParams: {code}});
    } else {
      this.handleAuthenticationCode(code);
    }
  }

  private handleAuthenticationCode(code: string) {
    this._exchangeCode(code).subscribe(result => {
      this.handleAuthenticationResult(result);
    });
  }

  private handleAuthenticationResult(authResult: AuthResult) {
    if (authResult?.accessToken) {
      this.setSession(authResult);
      this.selectUserAndNavigateToApp();
      this.trackUserLastLogin();
    } else {
      this.router.navigate(['/']);
    }
  }

  private selectUserAndNavigateToApp() {
    this.store$.dispatch(new UsersAction.GetCurrentUser());
    this.store$
      .select(selectCurrentUser)
      .pipe(
        filter(user => !!user),
        take(1)
      )
      .subscribe(user => this.navigateToApplication(user));
  }

  private navigateToApplication(user?: User) {
    const path = this.getAndClearLoginRedirectPath();
    if (
      this.configurationService.getConfiguration().languageRedirect &&
      user?.language &&
      languageCodeMap[user.language]
    ) {
      window.location.href = createLanguageUrl(path, user.language);
    } else if (path) {
      this.router.navigateByUrl(path);
    } else {
      this.router.navigate(['/']);
    }
  }

  private trackUserLastLogin() {
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        take(1)
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

  private setSession(authResult: AuthResult) {
    this.accessToken = authResult.accessToken;
    this.accessToken$.next(authResult.accessToken);
    // Set the time that the access token will expire at
    this.expiresAt = new Date(authResult.expiresIn * 1000 + new Date().getTime()).getTime();

    if (this.configurationService.getConfiguration().authPersistence) {
      localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
      localStorage.setItem(EXPIRES_AT_KEY, String(this.expiresAt));

      if (this.shouldSaveRefreshToken() && authResult.refreshToken) {
        const expires = moment().add(6, 'months').toDate();
        Cookies.set(REFRESH_TOKEN_KEY, authResult.refreshToken, {secure: true, expires});
      }
    }
  }

  public logout() {
    if (!this.configurationService.getConfiguration().auth) {
      console.warn('Cannot log out. Authentication is disabled.');
      return;
    }

    this.clearLoginData();
    window.location.assign(this.getLogoutUrl());
  }

  private clearLoginData() {
    this.accessToken = null;
    this.expiresAt = null;

    if (this.configurationService.getConfiguration().authPersistence) {
      // Remove tokens and expiry time from localStorage
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ID_TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
    }

    Cookies.remove(REFRESH_TOKEN_KEY);
    if (this.getSessionType() !== SessionType.NeverAsk) {
      Cookies.remove(SESSION_HANDLING_KEY);
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
    if (this.configurationService.getConfiguration().auth) {
      // Check whether the current time is past the access token's expiry time
      return new Date().getTime() < this.getExpiresAt();
    }
    return true;
  }

  public isAuthenticated$(): Observable<boolean> {
    return interval(500).pipe(
      map(() => this.isAuthenticated()),
      distinctUntilChanged()
    );
  }

  public getAccessToken(): string {
    return this.accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getAccessToken$(): Observable<string> {
    return this.accessToken$.asObservable();
  }

  public hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  private getRefreshToken(): string {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }

  public getExpiresAt(): number {
    if (localStorage.getItem(EXPIRES_AT_KEY)) {
      return Number(localStorage.getItem(EXPIRES_AT_KEY));
    }
    return this.expiresAt;
  }

  private renewToken() {
    this.auth0.checkSession({}, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        this.setSession(result);
      }
    });
  }

  private refreshToken() {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    this._refreshToken(this.getRefreshToken()).subscribe(result => {
      result && this.setSession(result);
      this.refreshing = false;
    });
  }

  private renewToken$(): Observable<AuthResult> {
    const subject = new Subject<AuthResult>();
    this.auth0.checkSession({}, (error, result) => subject.next(error ? null : result));
    return subject.asObservable().pipe(tap(response => response && this.setSession(response)));
  }

  public refreshToken$(): Observable<AuthResult> {
    if (this.activeRefresh$) {
      return this.activeRefresh$;
    }

    this.activeRefresh$ = interval(1000).pipe(
      filter(() => !this.refreshing),
      take(1),
      tap(() => (this.refreshing = true)),
      mergeMap(() => this._refreshToken(this.getRefreshToken())),
      tap(response => {
        response && this.setSession(response);
        this.refreshing = false;
        this.activeRefresh$ = null;
      }),
      share()
    );

    return this.activeRefresh$;
  }

  private initInterval() {
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        this.check();
      }, CHECK_INTERVAL);
    });
  }

  private check() {
    if (this.hasRefreshToken()) {
      const expiresAt = this.getExpiresAt();
      const expiresInMinutes = (expiresAt - Date.now()) / 1000 / 60;
      if (expiresInMinutes <= REFRESH_TOKEN_MINUTES) {
        this.ngZone.runOutsideAngular(() => {
          this.refreshToken();
        });
      }
    } else if (this.isAuthenticated()) {
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
    const restrictedPaths = ['/agreement', '/logout', '/auth', '/session-expired', '/session'];
    return restrictedPaths.some(path => {
      const pathWithOrigin = window.location.origin + this.location.prepareExternalUrl(path);
      return redirectPath.startsWith(path) || redirectPath.startsWith(pathWithOrigin);
    });
  }

  public checkToken(): Observable<boolean> {
    return this.checkServerResponse().pipe(
      mergeMap(success => {
        if (success) {
          const observable$ = this.hasRefreshToken() ? this.refreshToken$() : this.renewToken$();
          return observable$.pipe(map(response => !!response));
        } else if (this.hasRefreshToken()) {
          return this.refreshToken$().pipe(map(response => !!response));
        }
        return of(false);
      })
    );
  }

  private checkServerResponse(): Observable<boolean> {
    if (this.getAccessToken()) {
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
    return of(false);
  }

  private _exchangeCode(code: string): Observable<AuthResult> {
    const params = new HttpParams().set('code', code);
    return this.httpClient
      .post<AuthResult>(`${this.authApiPrefix()}/exchange-code`, {}, {params})
      .pipe(catchError(() => of(null)));
  }

  private _refreshToken(token: string): Observable<AuthResult> {
    const params = new HttpParams().set('token', token);
    return this.httpClient
      .post<AuthResult>(`${this.authApiPrefix()}/refresh`, {}, {params})
      .pipe(catchError(() => of(null)));
  }

  private authApiPrefix(): string {
    return `${this.configurationService.getConfiguration().apiUrl}/rest/auth`;
  }
}

interface AuthResult {
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
}
