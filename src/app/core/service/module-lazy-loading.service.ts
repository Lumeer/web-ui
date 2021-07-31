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

import {Injectable, OnDestroy} from '@angular/core';
import {NavigationEnd, RouteConfigLoadEnd, RouteConfigLoadStart, Router} from '@angular/router';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModuleLazyLoadingService implements OnDestroy {
  private lazyLoading$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();

  constructor(private router: Router) {}

  public init() {
    this.subscriptions.add(this.subscribeToRouterEvents());
  }

  private subscribeToRouterEvents(): Subscription {
    return this.router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart) {
        this.lazyLoading$.next(true);
      }
      if (event instanceof RouteConfigLoadEnd || event instanceof NavigationEnd) {
        this.lazyLoading$.next(false);
      }
    });
  }

  public observeLazyLoading(): Observable<boolean> {
    return this.lazyLoading$;
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
