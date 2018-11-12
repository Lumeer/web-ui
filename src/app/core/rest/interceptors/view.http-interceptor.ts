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
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {first, mergeMap} from 'rxjs/operators';
import {isBackendUrl} from '../../api/api.utils';
import {AppState} from '../../store/app.state';
import {selectViewCode} from '../../store/navigation/navigation.state';

@Injectable()
export class ViewHttpInterceptor implements HttpInterceptor {
  public constructor(private store: Store<AppState>) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isBackendUrl(request.url)) {
      return next.handle(request);
    }

    return this.store.select(selectViewCode).pipe(
      first(),
      mergeMap(viewCode => {
        if (viewCode) {
          const viewRequest = request.clone({
            setHeaders: {view_code: viewCode},
          });
          return next.handle(viewRequest);
        }

        return next.handle(request);
      })
    );
  }
}
