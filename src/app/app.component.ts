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

import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Store} from '@ngrx/store';
import * as Sentry from '@sentry/browser';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import * as jsSHA from 'jssha';
import {SnotifyService} from 'ng-snotify';
import {filter, first} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {AuthService} from './auth/auth.service';
import {AppState} from './core/store/app.state';
import {selectCurrentUser} from './core/store/users/users.state';

declare let $: any;

@Component({
  selector: 'lmr-app',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('browserWarning')
  public browserWarning: ElementRef;

  public isChrome = true;

  constructor(
    private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef,
    private snotifyService: SnotifyService,
    private store$: Store<AppState>,
    private title: Title
  ) {
    this.title.setTitle('Lumeer - Easy Business Booster');

    this.handleAuthentication();
    this.startGoogleAnalyticsTracking();
    this.setUpExternalServicesUserContext();
  }

  private handleAuthentication() {
    if (environment.auth) {
      this.authService.handleAuthentication();
    }
  }

  private startGoogleAnalyticsTracking() {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.startTracking();
  }

  private setUpExternalServicesUserContext() {
    this.store$
      .select(selectCurrentUser)
      .pipe(
        filter(user => !!user),
        first()
      )
      .subscribe(user => {
        const userIdHash = hashUserId(user.id);
        this.setGoogleAnalyticsUsername(userIdHash);
        this.configureSentryUserScope(userIdHash);
      });
  }

  private setGoogleAnalyticsUsername(userIdHash: string) {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.setUsername(userIdHash);
  }

  private configureSentryUserScope(userIdHash: string) {
    if (!environment.sentryDsn) {
      return;
    }

    Sentry.configureScope(scope => {
      scope.setUser({
        id: userIdHash,
      });
    });
  }

  public ngOnInit() {
    this.setNotificationStyle();
    try {
      this.isChrome = ((navigator as any).userAgent as string).toLowerCase().indexOf('chrome') >= 0;
    } catch (e) {
      this.isChrome = false;
    }
  }

  public setNotificationStyle(): void {
    this.snotifyService.setDefaults({
      toast: {
        titleMaxLength: 20,
        backdrop: -1,
        timeout: 3000,
        showProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
      },
    });
  }

  public ngAfterViewInit() {
    if (!this.browserWarning || !this.browserWarning.nativeElement) {
      return;
    }

    $('#browserAlert').on('closed.bs.alert', () => {
      // the rest of the page needs to adapt its height
      this.changeDetector.detectChanges();
    });
  }
}

function hashUserId(userId: string): string {
  if (userId) {
    const sha3 = new jsSHA('SHA3-512', 'TEXT');
    sha3.update(userId);
    return sha3.getHash('HEX');
  }

  return 'unknown';
}
