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

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {Observable} from 'rxjs/Observable';
import {Collection} from '../dto/collection';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LumeerError} from '../error/lumeer.error';
import {catchError} from 'rxjs/operators';

@Injectable()
export class ImportService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public importFile(format: string, data: string, name: string): Observable<Collection> {
    const queryParams = new HttpParams().set('format', format).set('name', name);

    return this.http.post<Collection>(this.apiPrefix(), data, {params: queryParams})
      .pipe(catchError(ImportService.handleGlobalError));
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/import`;
  }

}
