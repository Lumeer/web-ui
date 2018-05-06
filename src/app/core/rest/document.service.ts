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

import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {isNullOrUndefined} from 'util';

import {Document} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {mergeMap, map} from 'rxjs/operators';

// TODO send data attribute without '_id'
@Injectable()
export class DocumentService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createDocument(document: Document): Observable<Document> {
    return this.httpClient.post(this.apiPrefix(document.collectionId), document, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => response.headers.get('Location').split('/').pop()),
      mergeMap(id => {
        document.id = id;
        return Observable.of(document);
      })
    );
  }

  public updateDocument(document: Document): Observable<Document> {
    return this.httpClient.put<Document>(`${this.apiPrefix(document.collectionId)}/${document.id}/data`, document.data)
      .pipe(map(returnedDocument => {
          return {...returnedDocument, collectionId: document.collectionId};
        })
      );
  }

  public patchDocumentData(document: Document): Observable<Document> {
    return this.httpClient.patch<Document>(`${this.apiPrefix(document.collectionId)}/${document.id}/data`, document.data);
  }


  public removeDocument(collectionId: string, documentId: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(
      `${this.apiPrefix(collectionId)}/${documentId}`,
      {observe: 'response', responseType: 'text'}
    );
  }

  public addFavorite(collectionId: string, documentId: string,): Observable<any> {
    return this.httpClient.post(`${this.apiPrefix(collectionId)}/${documentId}/favorite`, {});
  }

  public removeFavorite(collectionId: string, documentId: string): Observable<any> {
    return this.httpClient.delete(`${this.apiPrefix(collectionId)}/${documentId}/favorite`);
  }

  public getDocument(collectionId: string, documentId: string): Observable<Document> {
    return this.httpClient.get<Document>(`${this.apiPrefix(collectionId)}/${documentId}`);
  }

  public getDocuments(collectionId: string, pageNumber?: number, pageSize?: number): Observable<Document[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Document[]>(this.apiPrefix(collectionId), {params: queryParams});
  }

  private apiPrefix(collectionId: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionId}/documents`;
  }

}
