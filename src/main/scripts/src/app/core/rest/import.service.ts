/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {Observable} from 'rxjs/Observable';
import {Collection} from '../dto/collection';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LumeerError} from '../error/lumeer.error';

@Injectable()
export class ImportService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public importFile(format: string, data: string): Observable<Collection> {
    let queryParams = new HttpParams().set('format', format);

    return this.http.post<Collection>(this.apiPrefix(), data, {params: queryParams})
      .catch(ImportService.handleGlobalError);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(): string {
    let organization = this.workspaceService.organizationCode;
    let project = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organization}/projects/${project}/import`;
  }

}
