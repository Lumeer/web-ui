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
import {HttpClient, HttpErrorResponse, HttpParams, HttpResponse} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {Document} from '../dto/document';
import {Observable} from 'rxjs/Observable';
import {isNullOrUndefined} from 'util';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';

// TODO send data attribute without '_id'
@Injectable()
export class DocumentService {

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public createDocument(document: Document): Observable<HttpResponse<object>> {
    return this.httpClient.post(this.apiPrefix(document.collectionCode), document, {observe: 'response', responseType: 'text'})
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

  public removeDocument(document: Document): Observable<HttpResponse<any>> {
    return this.httpClient.delete(
      `${this.apiPrefix(document.collectionCode)}/${document.id}`,
      {observe: 'response', responseType: 'text'}
    ).catch(error => this.handleGlobalError(error));
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
