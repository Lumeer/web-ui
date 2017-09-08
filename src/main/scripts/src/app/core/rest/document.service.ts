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
import {HttpClient, HttpErrorResponse, HttpParams, HttpResponse} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {Document} from '../dto/document';
import {Observable} from 'rxjs/Observable';
import {isNullOrUndefined} from 'util';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';

@Injectable()
export class DocumentService {

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public createDocument(document: Document): Observable<HttpResponse<object>> {
    return this.httpClient.post(this.apiPrefix(document.collectionCode), document, {observe: 'response'})
      .catch(error => this.handleGlobalError(error));
  }

  public updateDocument(document: Document): Observable<Document> {
    return this.httpClient.put<Document>(`${this.apiPrefix(document.collectionCode)}/${document.id}/data`, document.data)
      .catch(error => this.handleGlobalError(error));
  }

  public patchDocument(document: Document): Observable<Document> {
    return this.httpClient.patch<Document>(`${this.apiPrefix(document.collectionCode)}/${document.id}/data`, document.data)
      .catch(error => this.handleGlobalError(error));
  }

  public removeDocument(document: Document): Observable<HttpResponse<object>> {
    return this.httpClient.delete(`${this.apiPrefix(document.collectionCode)}/${document.id}`, {observe: 'response'})
      .catch(error => this.handleGlobalError(error));
  }

  public getDocument(collectionCode: string, documentId: string): Observable<Document> {
    return this.httpClient.get<Document>(`${this.apiPrefix(collectionCode)}/${documentId}`)
      .catch(error => this.handleGlobalError(error));
  }

  public getDocuments(collectionCode: string, pageNumber?: number, pageSize?: number): Observable<Document[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Document[]>(this.apiPrefix(collectionCode), {params: queryParams})
      .catch(error => this.handleGlobalError(error));
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionCode}/documents`;
  }

  private handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
