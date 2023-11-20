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
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  constructor(private http: HttpClient) {}

  public getDataSize(url: string): Observable<{mimeType: string; size: number}> {
    return this.http.head(url, {observe: 'response'}).pipe(
      map(response => ({
        mimeType: response.headers.get('content-type'),
        size: +response.headers.get('content-length') || 0,
      }))
    );
  }

  public downloadData(url: string): Observable<string> {
    return this.http.get(url, {responseType: 'text'});
  }

  public downloadBlob(url: string): Observable<Blob> {
    return this.http.get(url, {responseType: 'blob'});
  }
}
