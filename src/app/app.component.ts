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

import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewContainerRef} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import * as Sentry from '@sentry/browser';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import mixpanel from 'mixpanel-browser';
import * as moment from 'moment';
import {SnotifyService} from 'ng-snotify';
import {BehaviorSubject, Subscription} from 'rxjs';
import {catchError, filter, first, timeout, withLatestFrom} from 'rxjs/operators';
import smartlookClient from 'smartlook-client';
import {environment} from '../environments/environment';
import {AuthService} from './auth/auth.service';
import {superUserEmails} from './auth/super-user-emails';
import {ServiceLevelType} from './core/dto/service-level-type';
import {PusherService} from './core/pusher/pusher.service';
import {ModuleLazyLoadingService} from './core/service/module-lazy-loading.service';
import {AppState} from './core/store/app.state';
import {selectServiceLimitsByWorkspace} from './core/store/organizations/service-limits/service-limits.state';
import {selectCurrentUser} from './core/store/users/users.state';
import {hashUserId} from './shared/utils/system.utils';
import {VideosAction} from './core/store/videos/videos.action';
import {getAllVideos} from './core/store/videos/videos.data';
import {SessionService} from './auth/session.service';
import {ConstraintDataService} from './core/service/constraint-data.service';
import {TooltipConfig} from 'ngx-bootstrap';

@Component({
  selector: 'lmr-app',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {
  public isChrome = true;

  public lazyLoading$ = new BehaviorSubject(false);

  constructor(
    private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef,
    private i18n: I18n,
    private moduleLazyLoadingService: ModuleLazyLoadingService,
    private router: Router,
    private snotifyService: SnotifyService,
    private store$: Store<AppState>,
    private title: Title,
    private pusherService: PusherService,
    private sessionService: SessionService,
    private tooltipConfig: TooltipConfig,
    private constraintDataService: ConstraintDataService, // for init constraint data
    public vcRef: ViewContainerRef // for the ngx-color-picker
  ) {
    this.title.setTitle(this.i18n({id: 'page.title', value: 'Lumeer - Visual Project&Team Management'}));

    this.moduleLazyLoadingService.init();
    this.initPushNotifications();
    this.initVideos();
    this.handleAuthentication();
    this.startAnalyticsTracking();
    this.setUpExternalServicesUserContext();
    this.initCheckUserInteraction();

    this.tooltipConfig.adaptivePosition = true;
    this.tooltipConfig.container = 'body';
    this.tooltipConfig.placement = 'auto';
    this.tooltipConfig.delay = 100;
  }

  private initPushNotifications() {
    if (environment.pusherKey) {
      this.pusherService.init();
    }
  }

  private initVideos() {
    if (environment.videoKey) {
      this.store$.dispatch(new VideosAction.LoadVideos({videos: getAllVideos(), apiKey: environment.videoKey}));
    }
  }

  private handleAuthentication() {
    if (environment.auth) {
      this.authService.handleAuthentication();
    }
  }

  private startAnalyticsTracking() {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.startTracking();

    if (environment.mixpanelKey) {
      mixpanel.init(environment.mixpanelKey);
    }
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

        this.setAnalyticsUsername(userIdHash);
        this.setAnalyticsDimensions(serviceLevel, signUpDate);

        this.configureSentryUserScope(userIdHash);

        if (environment.mixpanelKey) {
          mixpanel.track('Application Started');
        }
      });
  }

  private setAnalyticsUsername(userIdHash: string) {
    if (!environment.analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.setUsername(userIdHash);
  }

  private setAnalyticsDimensions(serviceLevel: string, monthYear?: string) {
    if (!environment.analytics) {
      return;
    }

    const dimensions: {dimension1?: string; dimension2: string} = {dimension2: serviceLevel};
    if (monthYear) {
      dimensions.dimension1 = monthYear;
    }

    this.angulartics2GoogleAnalytics.setUserProperties(dimensions);

    if (environment.mixpanelKey) {
      mixpanel.register({'Registered on': monthYear, 'Service Level': serviceLevel});
    }
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
    this.subscribeToModuleLazyLoading();
  }

  private subscribeToModuleLazyLoading(): Subscription {
    return this.moduleLazyLoadingService
      .observeLazyLoading()
      .subscribe(lazyLoading => this.lazyLoading$.next(lazyLoading));
  }

  public onHideLoadingIndicator() {
    this.lazyLoading$.next(false);
  }

  private initSmartlook() {
    if (environment.smartlookKey) {
      this.store$
        .pipe(
          select(selectCurrentUser),
          filter(user => user && !superUserEmails.includes(user.email)),
          timeout(10000),
          first(),
          catchError(() => null)
        )
        .subscribe(() => {
          smartlookClient.init(environment.smartlookKey);
        });
    }
  }

  private initCheckUserInteraction() {
    ['mousedown', 'keypress', 'onscroll', 'wheel'].forEach(type =>
      document.body.addEventListener(type, () => this.userInteracted())
    );
  }

  private userInteracted() {
    this.sessionService.onUserInteraction();
    this.authService.onUserInteraction();
  }
}

function dateToMonthYear(d: Date): string {
  if (d) {
    return moment(d).format('YYYY/MM');
  }

  return null;
}
