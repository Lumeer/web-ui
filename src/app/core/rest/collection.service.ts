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
import {ConfiguredAttribute} from '../../collection/config/tab/attribute-list/configured-attribute';
import {Attribute} from '../dto/attribute';

import {Collection} from '../dto/collection';
import {BadInputError} from '../error/bad-input.error';
import {AppState} from '../store/app.state';
import {HomePageService} from './home-page.service';
import {PermissionService} from './permission.service';

// TODO add add support for Default Attribute
@Injectable()
export class CollectionService extends PermissionService {

  constructor(protected httpClient: HttpClient,
              protected store: Store<AppState>,
              private homePageService: HomePageService) {
    super(httpClient, store);
  }

  public createCollection(collection: Collection): Observable<Collection> {
    return this.httpClient.post(
      this.apiPrefix(), this.toDto(collection),
      {observe: 'response', responseType: 'text'}
    ).pipe(
      map(response => response.headers.get('Location').split('/').pop()),
      tap(code => this.homePageService.addLastUsedCollection(code).subscribe()),
      map(code => ({...collection, code: code})), // TODO return fresh instance from the server instead
      catchError(this.handleError)
    );
  }

  public updateCollection(collection: Collection, collectionCode?: string): Observable<Collection> {
    if (!collectionCode) {
      collectionCode = collection.code;
    }

    this.homePageService.addLastUsedCollection(collectionCode).subscribe();
    return this.httpClient.put(`${this.apiPrefix()}/${collectionCode}`, this.toDto(collection)).pipe(
      catchError(this.handleError),
      switchMap(collection => this.homePageService.checkFavoriteCollection(collection))
    );
  }

  public removeCollection(collectionCode: string): Observable<string> {
    this.homePageService.removeFavoriteCollection(collectionCode).subscribe();
    this.homePageService.removeLastUsedCollection(collectionCode).subscribe();
    this.homePageService.removeLastUsedDocuments(collectionCode).subscribe();
    this.homePageService.removeFavoriteDocuments(collectionCode).subscribe();
    return this.httpClient.delete(
      `${this.apiPrefix()}/${collectionCode}`,
      {observe: 'response', responseType: 'text'}
    ).pipe(
      map(() => collectionCode),
      catchError(this.handleError)
    );
  }

  public toggleCollectionFavorite(collection: Collection): Observable<boolean> {
    if (collection.isFavorite) {
      return this.homePageService.removeFavoriteCollection(collection.code);
    }
    return this.homePageService.addFavoriteCollection(collection.code);
  }

  public getCollection(collectionCode: string): Observable<Collection> {
    return this.httpClient.get<Collection>(`${this.apiPrefix()}/${collectionCode}`).pipe(
      catchError(CollectionService.handleGlobalError),
      switchMap(collection => this.homePageService.checkFavoriteCollection(collection))
    );
  }

  public getLastUsedCollections(): Observable<Collection[]> {
    return this.homePageService.getLastUsedCollections().pipe(
      switchMap(codes => this.convertCodesToCollections(codes))
    );
  }

  public getFavoriteCollections(): Observable<Collection[]> {
    return this.homePageService.getFavoriteCollections().pipe(
      switchMap(codes => this.convertCodesToCollections(codes))
    );
  }

  public getCollections(pageNumber?: number, pageSize?: number): Observable<Collection[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Collection[]>(this.apiPrefix(), {params: queryParams}).pipe(
      catchError(CollectionService.handleGlobalError),
      switchMap(collections => this.homePageService.checkFavoriteCollections(collections))
    );
  }

  /**
   * @deprecated Get attributes from collection instead.
   */
  public getAttributes(collectionCode: string): Observable<Attribute[]> {
    return this.httpClient.get<Attribute[]>(`${this.apiPrefix()}/${collectionCode}/attributes`).pipe(
      catchError(CollectionService.handleGlobalError)
    );
  }

  public updateAttribute(collectionCode: string, fullName: string, attribute: Attribute): Observable<Attribute> {
    this.homePageService.addLastUsedCollection(collectionCode).subscribe();
    return this.httpClient.put<Attribute>(`${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`, this.attributeToDto(attribute)).pipe(
      catchError(CollectionService.handleGlobalError)
    );
  }

  public removeAttribute(collectionCode: string, fullName: string): Observable<HttpResponse<any>> {
    this.homePageService.addLastUsedCollection(collectionCode).subscribe();
    return this.httpClient.delete(
      `${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`,
      {observe: 'response', responseType: 'text'}
    );
  }

  protected actualApiPrefix() {
    const collectionCode = this.workspace.collectionCode;

    return `${this.apiPrefix()}/${collectionCode}`;
  }

  private toDto(collection: Collection): Collection {
    let dtoAttributes = [];
    if (collection.attributes) {
      dtoAttributes = collection.attributes.map(this.attributeToDto);
    }

    // TODO send desctiption to the server too
    return {
      code: collection.code,
      name: collection.name,
      color: collection.color,
      icon: collection.icon,
      permissions: collection.permissions,
      attributes: dtoAttributes
    };
  }

  private attributeToDto(attribute: Attribute | ConfiguredAttribute): Attribute {
    return {
      constraints: attribute.constraints,
      fullName: attribute.fullName,
      name: attribute.name,
      usageCount: attribute.usageCount
    };
  }

  private apiPrefix(): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections`;
  }

  private handleError(error: HttpErrorResponse): ErrorObservable {
    if (error.status === 400) {
      throw new BadInputError('Name already exists');
    }
    return CollectionService.handleGlobalError(error);
  }

  private convertCodesToCollections(codes: string[]): Observable<Collection[]> {
    return Observable.combineLatest(codes.map(code => this.getCollection(code)));
  }
}
