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

import {HttpClient, HttpErrorResponse, HttpParams, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';

import {Document} from '../dto/document';
import {LumeerError} from '../error/lumeer.error';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {HomePageService} from './home-page.service';

// TODO send data attribute without '_id'
@Injectable()
export class DocumentService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>,
              private homePageService: HomePageService) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createDocument(document: Document): Observable<Document> {
    return this.httpClient.post(this.apiPrefix(document.collectionId), document, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      catchError(error => this.handleGlobalError(error)),
      map(response => response.headers.get('Location').split('/').pop()),
      tap(id => this.addLastUsed(document.collectionId, id)),
      switchMap(id => {
        document.id = id;
        return Observable.of(document);
      })
    );
  }

  public updateDocument(document: Document): Observable<Document> {
    this.addLastUsed(document.collectionId, document.id);
    return this.httpClient.put<Document>(`${this.apiPrefix(document.collectionId)}/${document.id}/data`, document.data)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        map(returnedDocument => {
          return {...returnedDocument, collectionId: document.collectionId};
        }),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public patchDocumentData(document: Document): Observable<Document> {
    this.addLastUsed(document.collectionId, document.id);
    return this.httpClient.patch<Document>(`${this.apiPrefix(document.collectionId)}/${document.id}/data`, document.data)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public toggleDocumentFavorite(document: Document): Observable<boolean> {
    if (document.favorite) {
      return this.homePageService.removeFavoriteDocument(document.collectionId, document.id);
    }
    return this.homePageService.addFavoriteDocument(document.collectionId, document.id);
  }

  public removeDocument(collectionId: string, documentId: string): Observable<HttpResponse<any>> {
    this.removeLastUsedAndFavorite(collectionId, documentId);
    return this.httpClient.delete(
      `${this.apiPrefix(collectionId)}/${documentId}`,
      {observe: 'response', responseType: 'text'}
    ).pipe(catchError(error => this.handleGlobalError(error)));
  }

  public getDocument(collectionId: string, documentId: string): Observable<Document> {
    return this.httpClient.get<Document>(`${this.apiPrefix(collectionId)}/${documentId}`)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public getLastUsedDocuments(): Observable<Document[]> {
    return this.homePageService.getLastUsedDocuments().pipe(
      switchMap(ids => this.convertIdsToDocuments(ids))
    );
  }

  public getFavoriteDocuments(): Observable<Document[]> {
    return this.homePageService.getFavoriteDocuments().pipe(
      switchMap(ids => this.convertIdsToDocuments(ids))
    );
  }

  public getDocuments(collectionId: string, pageNumber?: number, pageSize?: number): Observable<Document[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Document[]>(this.apiPrefix(collectionId), {params: queryParams})
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(documents => this.homePageService.checkFavoriteDocuments(documents))
      );
  }

  private apiPrefix(collectionId: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionId}/documents`;
  }

  private handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private convertIdsToDocuments(ids: string[]): Observable<Document[]> {
    return Observable.combineLatest(ids.map(id => {
      const [collectionId, documentId] = id.split(' ', 2);
      return this.getDocument(collectionId, documentId);
    }));
  }

  private addLastUsed(collectionId: string, id: string) {
    this.homePageService.addLastUsedCollection(collectionId);
    this.homePageService.addLastUsedDocument(collectionId, id);
  }

  private removeLastUsedAndFavorite(collectionId: string, id: string) {
    this.homePageService.addLastUsedCollection(collectionId);
    this.homePageService.removeLastUsedDocument(collectionId, id);
    this.homePageService.removeFavoriteDocument(collectionId, id);
  }

}
