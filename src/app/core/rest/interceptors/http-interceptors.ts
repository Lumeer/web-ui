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
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {AuthHttpInterceptor} from './auth.http-interceptor';
import {CorrelationIdHttpInterceptor} from './correlation-id.http-interceptor';
import {EnvironmentHttpInterceptor} from './environment.http-interceptor';
import {ResponseTimeHttpInterceptor} from './response.time.http-interceptor';
import {SentryHttpInterceptor} from './sentry.http-interceptor';
import {TimezoneHttpInterceptor} from './timezone.http-interceptor';
import {ViewHttpInterceptor} from './view.http-interceptor';

export const httpInterceptorProviders = [
  {provide: HTTP_INTERCEPTORS, useClass: ResponseTimeHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: SentryHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: EnvironmentHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: ViewHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: CorrelationIdHttpInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: TimezoneHttpInterceptor, multi: true},
];
