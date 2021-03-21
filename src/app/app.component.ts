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

import {AfterViewInit, Component, OnInit, ViewContainerRef} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import * as Sentry from '@sentry/browser';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import mixpanel from 'mixpanel-browser';
import * as moment from 'moment';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, filter, first, map, timeout, withLatestFrom} from 'rxjs/operators';
import smartlookClient from 'smartlook-client';
import {AuthService} from './auth/auth.service';
import {superUserEmails} from './auth/super-user-emails';
import {ServiceLevelType} from './core/dto/service-level-type';
import {PusherService} from './core/pusher/pusher.service';
import {AppState} from './core/store/app.state';
import {selectServiceLimitsByWorkspace} from './core/store/organizations/service-limits/service-limits.state';
import {selectCurrentUser} from './core/store/users/users.state';
import {hashUserId} from './shared/utils/system.utils';
import {SessionService} from './auth/session.service';
import {TooltipConfig} from 'ngx-bootstrap/tooltip';
import Cookies from 'js-cookie';
import {APP_NAME_SELECTOR, LUMEER_REFERRAL} from './core/constants';
import {UserActivityService} from './auth/user-activity.service';
import {BsLocaleService} from 'ngx-bootstrap/datepicker';
import {parseQueryParams} from './core/store/navigation/query/query.util';
import {selectProjectByWorkspace, selectProjectDismissedWarningIds} from './core/store/projects/projects.state';
import {ConfigurationService} from './configuration/configuration.service';
import {LanguageCode} from './shared/top-panel/user-panel/user-menu/language';
import {defineLocale} from 'ngx-bootstrap/chronos';
import {csLocale, huLocale} from 'ngx-bootstrap/locale';

@Component({
  selector: APP_NAME_SELECTOR,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {
  public showPublicProjectWarning$: Observable<boolean>;

  constructor(
    private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private authService: AuthService,
    private router: Router,
    private store$: Store<AppState>,
    private title: Title,
    private pusherService: PusherService,
    private activityService: UserActivityService,
    private sessionService: SessionService,
    private tooltipConfig: TooltipConfig,
    private localeService: BsLocaleService,
    private configurationService: ConfigurationService,
    public vcRef: ViewContainerRef // for the ngx-color-picker
  ) {
    this.title.setTitle($localize`:@@page.title:Lumeer | Visual, easy project and team management`);

    this.storeReferralCookie();
    this.initPushNotifications();
    this.handleAuthentication();
    this.startAnalyticsTracking();
    this.setUpExternalServicesUserContext();
    this.initCheckUserInteraction();
    this.initTooltipConfig();
    this.initLanguage();
  }

  public ngOnInit() {
    this.subscribeToData();
  }

  private subscribeToData() {
    if (this.configurationService.getConfiguration().publicView) {
      this.showPublicProjectWarning$ = of(false);
    } else {
      this.showPublicProjectWarning$ = combineLatest([
        this.store$.pipe(select(selectProjectByWorkspace)),
        this.store$.pipe(select(selectProjectDismissedWarningIds)),
      ]).pipe(map(([project, dismissedIds]) => project && project.isPublic && !dismissedIds.includes(project.id)));
    }
  }

  private storeReferralCookie() {
    const urlParams = parseQueryParams(window.location.search);
    if (urlParams['ref']) {
      const referral = urlParams['ref'];

      if (!Cookies.get(LUMEER_REFERRAL)) {
        const domain =
          this.configurationService.getConfiguration().production || this.configurationService.getConfiguration().name
            ? '.lumeer.io'
            : 'localhost';
        Cookies.set(LUMEER_REFERRAL, referral, {sameSite: 'strict', domain, secure: true, expires: 366});
      }
    }
  }

  private initPushNotifications() {
    if (this.configurationService.getConfiguration().pusherKey) {
      this.pusherService.init();
    }
  }

  private handleAuthentication() {
    if (this.configurationService.getConfiguration().auth) {
      this.authService.handleAuthentication();
    }
  }

  private startAnalyticsTracking() {
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.startTracking();

    if (this.configurationService.getConfiguration().mixpanelKey) {
      mixpanel.init(this.configurationService.getConfiguration().mixpanelKey, {cross_site_cookie: true});
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

        if (this.configurationService.getConfiguration().mixpanelKey) {
          mixpanel.track('Application Started');
        }
      });
  }

  private setAnalyticsUsername(userIdHash: string) {
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }

    this.angulartics2GoogleAnalytics.setUsername(userIdHash);
  }

  private setAnalyticsDimensions(serviceLevel: string, monthYear?: string) {
    if (!this.configurationService.getConfiguration().analytics) {
      return;
    }

    const dimensions: {dimension1?: string; dimension2: string} = {dimension2: serviceLevel};
    if (monthYear) {
      dimensions.dimension1 = monthYear;
    }

    this.angulartics2GoogleAnalytics.setUserProperties(dimensions);

    if (this.configurationService.getConfiguration().mixpanelKey) {
      mixpanel.register({'Registered on': monthYear, 'Service Level': serviceLevel});
    }
  }

  private configureSentryUserScope(userIdHash: string) {
    if (!this.configurationService.getConfiguration().sentryDsn) {
      return;
    }

    Sentry.configureScope(scope => {
      scope.setUser({
        id: userIdHash,
      });
    });
  }

  public ngAfterViewInit() {
    this.initSmartlook();
  }

  private initSmartlook() {
    if (this.configurationService.getConfiguration().smartlookKey) {
      this.store$
        .pipe(
          select(selectCurrentUser),
          filter(user => user && !superUserEmails.includes(user.email)),
          timeout(10000),
          first(),
          catchError(() => of(null))
        )
        .subscribe(() => {
          smartlookClient.init(this.configurationService.getConfiguration().smartlookKey);
        });
    }
  }

  private initCheckUserInteraction() {
    this.activityService.resetUserInteraction();
    this.sessionService.init();
    ['mousedown', 'keypress', 'onscroll', 'wheel'].forEach(type =>
      document.body.addEventListener(type, () => this.activityService.onUserInteraction())
    );
  }

  private initTooltipConfig() {
    this.tooltipConfig.adaptivePosition = true;
    this.tooltipConfig.container = 'body';
    this.tooltipConfig.placement = 'auto';
    this.tooltipConfig.delay = 100;
  }

  private initLanguage() {
    this.localeService.use(this.configurationService.getConfiguration().locale);

    switch (this.configurationService.getConfiguration().locale) {
      case LanguageCode.CZ: {
        defineLocale('cs', csLocale);
        break;
      }
      case LanguageCode.HU: {
        defineLocale('hu', huLocale);
        break;
      }
    }
  }
}

function dateToMonthYear(d: Date): string {
  if (d) {
    return moment(d).format('YYYY/MM');
  }

  return null;
}
