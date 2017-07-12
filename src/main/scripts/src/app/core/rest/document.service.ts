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
import {HttpClient} from './http-client.service';
import {WorkspaceService} from '../workspace.service';
import {Observable} from 'rxjs/Observable';
import {isUndefined} from 'util';

@Injectable()
export class DocumentService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public getDocuments(collectionName: string, pageNumber?: number, pageSize?: number): Observable<any[]> {
    let queryParams = !isUndefined(pageNumber) && !isUndefined(pageSize) ? `?page=${pageNumber}&size=${pageSize}` : '';

    return this.http.get(this.apiPrefix(collectionName) + queryParams)
      .map(response => response.json());
  }

  public getDocument(collectionName: string, documentId: string): Observable<any> {
    return this.http.get(`${this.apiPrefix(collectionName)}/${documentId}`)
      .map(response => response.json());
  }

  private apiPrefix(collection: string): string {
    let organization = this.workspaceService.organizationCode;
    let project = this.workspaceService.projectCode;

    return `/lumeer-engine/rest/organizations/${organization}/projects/${project}/collections/${collection}/documents`;
  }

}
