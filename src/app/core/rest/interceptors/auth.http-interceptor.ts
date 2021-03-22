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

import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {EMPTY, Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../../../auth/auth.service';
import {isBackendUrl} from '../../api/api.utils';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  public constructor(
    private authService: AuthService,
    private router: Router,
    private configurationService: ConfigurationService
  ) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (
      !this.configurationService.getConfiguration().auth ||
      !isBackendUrl(request.url, this.configurationService.getConfiguration())
    ) {
      return next.handle(request);
    }

    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.authService.getAccessToken()}`,
      },
      withCredentials: true,
    });
    return next.handle(authRequest).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (this.authService.isAuthenticated() && shouldProcessLogin(request.url)) {
            this.authService.login(this.router.url);
          }
          if (shouldProcessLogin(request.url)) {
            return EMPTY;
          }
        }
        return throwError(error);
      })
    );
  }
}

function shouldProcessLogin(url: string): boolean {
  return !url.endsWith('/users/check');
}
