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

import {Injectable, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from './auth.service';
import {UserActivityService} from './user-activity.service';
import {ConfigurationService} from '../configuration/configuration.service';

const CHECK_INTERVAL = 3000; // millis

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private timerId: number;
  private readonly timeoutMinutes;

  public constructor(
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private activityService: UserActivityService,
    private configurationService: ConfigurationService
  ) {
    this.timeoutMinutes = this.configurationService.getConfiguration().sessionTimeout;
  }

  public init() {
    if (this.configurationService.getConfiguration().auth) {
      this.initInterval();
    }
  }

  private initInterval() {
    this.ngZone.runOutsideAngular(() => {
      this.timerId = window.setInterval(() => {
        this.check();
      }, CHECK_INTERVAL);
    });
  }

  private check() {
    const now = Date.now();
    const timeLeft = this.activityService.getLastActivity() + this.timeoutMinutes * 60 * 1000;
    const isTimeout = timeLeft - now < 0;

    this.ngZone.run(() => {
      if (isTimeout) {
        window.clearInterval(this.timerId);
        if (this.authService.isAuthenticated()) {
          this.navigateToSessionExpiredPage();
        }
      }
    });
  }

  private navigateToSessionExpiredPage() {
    if (!this.authService.isPathOutsideApp(this.router.url)) {
      this.router.navigate(['/', 'session-expired'], {
        queryParams: {
          redirectUrl: this.router.url,
        },
      });
    }
  }
}
