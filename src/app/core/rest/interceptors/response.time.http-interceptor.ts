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

import {
  HttpClient,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ConfigurationService} from '../../../configuration/configuration.service';

class CustomHttpRequest<T> extends HttpRequest<T> {
  // Prevent automatic adding of the Content-Type header
  public detectContentTypeHeader(): string | null {
    return null;
  }
}

@Injectable()
export class ResponseTimeHttpInterceptor implements HttpInterceptor {
  private readonly TIMESTAMP_HEADER = 'X-Lumeer-Start-Timestamp';

  public constructor(
    private deviceService: DeviceDetectorService,
    private http: HttpClient,
    private configurationService: ConfigurationService
  ) {}

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const random = Math.floor(Math.random() * 100);

    if (req.url.indexOf('logz.io') >= 0) {
      const custReq = new CustomHttpRequest('POST', req.url, req.body);
      return next.handle(custReq);
    }

    if (!this.configurationService.getConfiguration().logzioKey) {
      return next.handle(req);
    }

    const startTimestamp = new Date().getTime();

    const newReq = req.clone({
      headers: req.headers.set(this.TIMESTAMP_HEADER, startTimestamp.toString()),
    });

    return next.handle(newReq).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const res = event as HttpResponse<any>;
          // another timestamp
          const endTimestamp: number = new Date().getTime();
          const headerStartTimestamp: number = Number(res.headers.get(this.TIMESTAMP_HEADER));

          if (headerStartTimestamp) {
            const responseTime = endTimestamp - headerStartTimestamp;
            const deviceInfo = this.deviceService.getDeviceInfo();

            // Log only about 10% of requests or suspicious requests
            if (random < 10 || responseTime > 999) {
              this.http
                .post(
                  `https://listener-${this.configurationService.getConfiguration().logzioRegion}.logz.io:8071/?token=${
                    this.configurationService.getConfiguration().logzioKey
                  }`,
                  {
                    startTime: headerStartTimestamp,
                    endTime: endTimestamp,
                    responseTime: responseTime,
                    url: res.url,
                    type: 'browser',
                    environment: this.configurationService.getConfiguration().name || 'localhost',
                    deviceInfo: JSON.stringify(deviceInfo),
                  },
                  {headers: new HttpHeaders()}
                )
                .subscribe();
            }
          }
        }
      })
    );
  }
}
