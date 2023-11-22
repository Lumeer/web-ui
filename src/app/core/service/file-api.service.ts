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
import {HttpClient, HttpEvent, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileApiService {
  constructor(private http: HttpClient) {}

  public downloadFile(url: string): Observable<HttpResponse<Blob>> {
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  public uploadFile(url: string, contentType: string, file: Blob): Observable<any> {
    return this.http.put(url, file, {
      headers: new HttpHeaders({'Content-Type': contentType}),
    });
  }

  public uploadFileWithProgress(url: string, contentType: string, file: Blob): Observable<HttpEvent<any>> {
    return this.http.put(url, file, {
      headers: new HttpHeaders({'Content-Type': contentType}),
      observe: 'events',
      reportProgress: true,
    });
  }

  public postFileWithProgress(url: string, contentType: string, file: Blob): Observable<HttpEvent<any>> {
    return this.http.post(url, file, {
      headers: new HttpHeaders({'Content-Type': contentType}),
      observe: 'events',
      reportProgress: true,
    });
  }
}
