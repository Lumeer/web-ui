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

import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {isBackendUrl} from '../../api/api.utils';

@Injectable()
export class SessionHttpInterceptor implements HttpInterceptor {
  private timeoutId: number;

  public constructor(private router: Router) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isBackendUrl(request.url)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      tap(() => {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = window.setTimeout(
          () => this.navigateToSessionExpiredPage(),
          environment.sessionTimeout * 60 * 1000
        );
      })
    );
  }

  private navigateToSessionExpiredPage() {
    this.router.navigate(['/', 'session-expired'], {
      queryParams: {
        redirectUrl: this.router.url,
      },
    });
  }
}
