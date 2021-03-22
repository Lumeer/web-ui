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

import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {isBackendUrl} from '../../api/api.utils';
import * as moment from 'moment-timezone';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class TimezoneHttpInterceptor implements HttpInterceptor {
  constructor(private configurationService: ConfigurationService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isBackendUrl(request.url, this.configurationService.getConfiguration())) {
      return next.handle(request);
    }

    const timezone = moment.tz.guess(true);

    const requestClone = request.clone({
      setHeaders: {'X-Lumeer-Timezone': timezone},
    });
    return next.handle(requestClone);
  }
}
