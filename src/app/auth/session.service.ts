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
import {Router} from '@angular/router';
import {BehaviorSubject, Subscription} from 'rxjs';
import {throttleTime} from 'rxjs/operators';
import {environment} from '../../environments/environment';

const CHECK_INTERVAL = 5 * 1000; // millis

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private subject$ = new BehaviorSubject({});
  private subscriptions = new Subscription();
  private timeoutId: number;

  public constructor(private router: Router) {
    this.subscribeToSubject();
  }

  public onUserInteraction() {
    this.subject$.next({});
  }

  private subscribeToSubject() {
    const subscription = this.subject$.pipe(throttleTime(CHECK_INTERVAL)).subscribe(() => this.resetSession());
    this.subscriptions.add(subscription);
  }

  private resetSession() {
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(
      () => this.navigateToSessionExpiredPage(),
      environment.sessionTimeout * 60 * 1000
    );
  }

  private navigateToSessionExpiredPage() {
    this.router.navigate(['/', 'session-expired'], {
      queryParams: {
        redirectUrl: this.router.url,
      },
    });
  }

  public destroy() {
    this.subscriptions.unsubscribe();
  }
}
