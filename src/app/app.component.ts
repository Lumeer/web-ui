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

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {select, Store} from '@ngrx/store';
import * as Sentry from '@sentry/browser';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import * as jsSHA from 'jssha';
import {SnotifyService} from 'ng-snotify';
import {filter, first, map, withLatestFrom} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {AuthService} from './auth/auth.service';
import {AppState} from './core/store/app.state';
import {selectCurrentUser} from './core/store/users/users.state';
import {RouteConfigLoadEnd, RouteConfigLoadStart, Router} from '@angular/router';
import {BehaviorSubject, Subscription} from 'rxjs';
import {PusherService} from './core/pusher/pusher.service';
import * as moment from 'moment';
import {selectServiceLimitsByWorkspace} from './core/store/organizations/service-limits/service-limits.state';
import {ServiceLevelType} from './core/dto/service-level-type';
import smartlookClient from 'smartlook-client';
import {superUserEmails} from './auth/super-user-emails';

declare let $: any;

@Component({
  selector: 'lmr-app',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('browserWarning')
  public browserWarning: ElementRef;

  public isChrome = true;

  public lazyLoading$ = new BehaviorSubject(false);

  constructor(
    private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    private snotifyService: SnotifyService,
    private store$: Store<AppState>,
    private title: Title,
    private pusherService: PusherService,
    public vcRef: ViewContainerRef // for the ngx-color-picker
  ) {
    this.title.setTitle('Lumeer - Easy Business Booster');

    this.initPushNotifications();
    this.handleAuthentication();
    this.startGoogleAnalyticsTracking();
    this.setUpExternalServicesUserContext();
  }

  private initPushNotifications() {
    if (environment.pusherKey) {
      this.pusherService.init();
    }
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
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        withLatestFrom(this.store$.pipe(select(selectServiceLimitsByWorkspace))),
        first()
      )
      .subscribe(([user, limits]) => {
        const userIdHash = hashUserId(user.id);
        const signUpDate = dateToMonthYear(user.agreementDate);
        const serviceLevel: string = limits ? limits.serviceLevel : ServiceLevelType.FREE;

        this.setGoogleAnalyticsUsername(userIdHash);
        this.setGoogleAnalyticsDimensions(serviceLevel, signUpDate);

        this.configureSentryUserScope(userIdHash);
      });
  }

  private setGoogleAnalyticsUsername(userIdHash: string) {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.setUsername(userIdHash);
  }

  private setGoogleAnalyticsDimensions(serviceLevel: string, monthYear?: string) {
    if (!environment.analytics) {
      return;
    }

    const dimensions: {dimension1?: string; dimension2: string} = {dimension2: serviceLevel};
    if (monthYear) {
      dimensions.dimension1 = monthYear;
    }

    this.angulartics2GoogleAnalytics.setUserProperties(dimensions);
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
    this.showBrowserWarningOutsideChrome();
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

  private showBrowserWarningOutsideChrome() {
    try {
      const userAgent = (navigator as any).userAgent as string;
      this.isChrome = userAgent.toLowerCase().includes('chrome') || userAgent.includes('CriOS'); // Chrome for iOS
    } catch (e) {
      this.isChrome = false;
    }
  }

  public ngAfterViewInit() {
    this.initSmartlook();
    this.bindBrowserWarningCloseCallback();
    this.subscribeToRouterEvents();
  }

  private bindBrowserWarningCloseCallback() {
    if (!this.browserWarning || !this.browserWarning.nativeElement) {
      return;
    }

    $('#browserAlert').on('closed.bs.alert', () => {
      // the rest of the page needs to adapt its height
      this.changeDetector.detectChanges();
    });
  }

  private subscribeToRouterEvents(): Subscription {
    return this.router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart) {
        this.lazyLoading$.next(true);
      }
      if (event instanceof RouteConfigLoadEnd) {
        this.lazyLoading$.next(false);
      }
    });
  }

  public onHideLoadingIndicator() {
    this.lazyLoading$.next(false);
  }

  private initSmartlook() {
    if (environment.smartlookKey) {
      this.store$
        .pipe(
          select(selectCurrentUser),
          first(),
          filter(user => user && !superUserEmails.includes(user.email))
        )
        .subscribe(() => {
          smartlookClient.init(environment.smartlookKey);
        });
    }
  }
}

function hashUserId(userId: string): string {
  if (userId) {
    const sha = new jsSHA('SHA-1', 'TEXT');
    sha.update(userId);
    return sha.getHash('B64', {});
  }

  return 'unknown';
}

function dateToMonthYear(d: Date): string {
  if (d) {
    return moment(d).format('YYYY/MM');
  }

  return null;
}
