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
import {NavigationEnd, Router} from '@angular/router';

import {filter} from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/ban-types
declare const gtag: Function;

@Injectable({
  providedIn: 'root',
})
export class Ga4Service {
  private ga4Id: string;
  private initialized = false;

  public init(ga4Id: string, router: Router) {
    this.ga4Id = ga4Id;

    window['dataLayer'] = window['dataLayer'] || [];
    window['gtag'] = function () {
      // eslint-disable-next-line prefer-rest-params
      window['dataLayer'].push(arguments);
    };

    const customGtagScriptEle: HTMLScriptElement = document.createElement('script');
    customGtagScriptEle.async = true;
    customGtagScriptEle.src = 'https://www.googletagmanager.com/gtag/js?id=' + ga4Id;
    customGtagScriptEle.onload = () => {
      gtag('js', new Date());
      gtag('config', ga4Id, {send_page_view: false});

      router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
        gtag('event', 'page_view', {
          page_path: event.urlAfterRedirects,
        });
      });

      this.initialized = true;
    };

    document.head.prepend(customGtagScriptEle);
  }

  public setUserId(userId: string) {
    if (this.initialized) {
      gtag('config', this.ga4Id, {user_id: userId});
    }
  }

  public event(eventName: string, params = {}) {
    if (this.initialized) {
      gtag('event', eventName, params);
    }
  }

  public serviceLevel(serviceLevel: string) {
    if (this.initialized) {
      gtag('set', 'user_properties', {serviceLevel});
    }
  }
}
