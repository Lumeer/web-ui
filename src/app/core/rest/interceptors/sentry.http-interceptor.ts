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
import * as Sentry from '@sentry/browser';
import {Severity} from '@sentry/browser';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class SentryHttpInterceptor implements HttpInterceptor {
  constructor(private configurationService: ConfigurationService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(error => {
        if (this.configurationService.getConfiguration().sentryDsn && ![402, 500].includes(error.status)) {
          this.processError(error);
        }

        return throwError(error);
      })
    );
  }

  private processError(error: any): void {
    if (error instanceof Error || error instanceof ErrorEvent) {
      Sentry.captureException(error);
    } else if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        Sentry.captureException(error.error);
      }

      Sentry.captureMessage(`${error.status}: ${error.error}`, Severity.Error);
    } else {
      Sentry.captureException(error);
    }
  }
}
