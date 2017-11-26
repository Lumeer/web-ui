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
import {Store} from '@ngrx/store';

import {Document} from '../dto/document';
import {Observable} from 'rxjs/Observable';
import {isNullOrUndefined} from 'util';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {Workspace} from '../store/navigation/workspace.model';
import {selectWorkspace} from '../store/navigation/navigation.state';
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
    return this.httpClient.post(this.apiPrefix(document.collectionCode), document, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      catchError(error => this.handleGlobalError(error)),
      map(response => response.headers.get('Location').split('/').pop()),
      tap(id => this.addLastUsed(document.collectionCode, id)),
      switchMap(id => this.getDocument(document.collectionCode, id))
    );
  }

  public updateDocument(document: Document): Observable<Document> {
    this.addLastUsed(document.collectionCode, document.id);
    return this.httpClient.put<Document>(`${this.apiPrefix(document.collectionCode)}/${document.id}/data`, document.data)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public patchDocument(document: Document): Observable<Document> {
    this.addLastUsed(document.collectionCode, document.id);
    return this.httpClient.patch<Document>(`${this.apiPrefix(document.collectionCode)}/${document.id}/data`, document.data)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public toggleDocumentFavorite(document: Document): Observable<boolean> {
    if (document.isFavorite) {
      return this.homePageService.removeFavoriteDocument(document.collectionCode, document.id);
    }
    return this.homePageService.addFavoriteDocument(document.collectionCode, document.id);
  }

  public removeDocument(document: Document): Observable<HttpResponse<any>> {
    this.removeLastUsedAndFavorite(document.collectionCode, document.id);
    return this.httpClient.delete(
      `${this.apiPrefix(document.collectionCode)}/${document.id}`,
      {observe: 'response', responseType: 'text'}
    ).pipe(catchError(error => this.handleGlobalError(error)));
  }

  public getDocument(collectionCode: string, documentId: string): Observable<Document> {
    return this.httpClient.get<Document>(`${this.apiPrefix(collectionCode)}/${documentId}`)
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(document => this.homePageService.checkFavoriteDocument(document))
      );
  }

  public getLastUsedDocuments(): Observable<Document[]> {
    return this.homePageService.getLastUsedDocuments().pipe(
      switchMap(codes => this.convertCodesToDocuments(codes))
    );
  }

  public getFavoriteDocuments(): Observable<Document[]> {
    return this.homePageService.getFavoriteDocuments().pipe(
      switchMap(codes => this.convertCodesToDocuments(codes))
    );
  }

  public getDocuments(collectionCode: string, pageNumber?: number, pageSize?: number): Observable<Document[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Document[]>(this.apiPrefix(collectionCode), {params: queryParams})
      .pipe(
        catchError(error => this.handleGlobalError(error)),
        switchMap(documents => this.homePageService.checkFavoriteDocuments(documents))
      );
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionCode}/documents`;
  }

  private handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private convertCodesToDocuments(codes: string[]): Observable<Document[]> {
    return Observable.combineLatest(codes.map(code => {
      const vals = code.split(' ', 2);
      return this.getDocument(vals[0], vals[1]);
    }));
  }

  private addLastUsed(collectionCode: string, id: string){
    this.homePageService.addLastUsedCollection(collectionCode);
    this.homePageService.addLastUsedDocument(collectionCode, id);
  }

  private removeLastUsedAndFavorite(collectionCode: string, id: string){
    this.homePageService.addLastUsedCollection(collectionCode);
    this.homePageService.removeLastUsedDocument(collectionCode, id);
    this.homePageService.removeFavoriteDocument(collectionCode, id);
  }

}
