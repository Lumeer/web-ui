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

import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Auth0DecodedHash, Auth0UserProfile, WebAuth} from 'auth0-js';
import {of, Subscription, timer} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {AppState} from '../core/store/app.state';
import {UsersAction} from '../core/store/users/users.action';

const REDIRECT_KEY = 'auth_login_redirect';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const EXPIRES_AT_KEY = 'auth_expires_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0: WebAuth;

  private refreshSubscription: Subscription;

  public constructor(private location: Location, private router: Router, private store: Store<AppState>) {
    if (environment.auth) {
      const redirectUri = document.location.origin + location.prepareExternalUrl('auth');
      this.initAuth(redirectUri);
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
    this.saveLoginRedirectPath(redirectPath);
    this.auth0.authorize();
  }

  public handleAuthentication() {
    this.auth0.parseHash((error, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        this.store.dispatch(new UsersAction.GetCurrentUser());
      } else if (error) {
        this.router.navigate(['/']);
        console.error(error);
      }
    });
  }

  private setSession(authResult: Auth0DecodedHash): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());

    localStorage.setItem(ACCESS_TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(ID_TOKEN_KEY, authResult.idToken);
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt);

    this.scheduleRenewal();
  }

  public logout(): void {
    if (!environment.auth) {
      console.warn('Cannot log out. Authentication is disabled.');
      return;
    }

    // Remove tokens and expiry time from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);

    this.unscheduleRenewal();

    window.location.assign(this.getLogoutUrl());
  }

  public getLogoutUrl(): string {
    const returnToUrl = encodeURIComponent(document.location.origin + this.location.prepareExternalUrl('logout'));
    return `https://${environment.authDomain}/v2/logout?returnTo=${returnToUrl}&client_id=${environment.authClientId}`;
  }

  public isAuthenticated(): boolean {
    // Check whether the current time is past the access token's expiry time
    return new Date().getTime() < this.getExpiresAt();
  }

  public getAccessToken(): string {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getIdToken(): string {
    return localStorage.getItem(ID_TOKEN_KEY);
  }

  public getExpiresAt(): number {
    return Number(localStorage.getItem(EXPIRES_AT_KEY));
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

  public scheduleRenewal() {
    if (!this.isAuthenticated()) {
      return;
    }

    this.unscheduleRenewal();

    const source = of(this.getExpiresAt()).pipe(
      mergeMap(expiresAt => {
        // Use the delay in a timer to run the refresh at the proper time
        return timer(Math.max(1, expiresAt - Date.now()));
      })
    );

    // Once the delay time from above is reached, get a new JWT and schedule additional refreshes
    this.refreshSubscription = source.subscribe(() => {
      this.renewToken();
      this.scheduleRenewal();
    });
  }

  public unscheduleRenewal() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  public getLoginRedirectPath(): string {
    const redirectPath = localStorage.getItem(REDIRECT_KEY) || '/';
    return redirectPath !== '/agreement' ? redirectPath : '/';
  }

  public saveLoginRedirectPath(path: string) {
    localStorage.setItem(REDIRECT_KEY, path);
  }
}
