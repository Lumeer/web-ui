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
    return this.httpClient.post<Collection>(this.apiPrefix(), this.toDto(collection));
  }

  public updateCollection(collection: Collection): Observable<Collection> {
    this.homePageService.addLastUsedCollection(collection.id).subscribe();
    return this.httpClient.put(`${this.apiPrefix()}/${collection.id}`, this.toDto(collection)).pipe(
      catchError(this.handleError),
      switchMap(collection => this.homePageService.checkFavoriteCollection(collection))
    );
  }

  public removeCollection(collectionId: string): Observable<string> {
    this.homePageService.removeFavoriteCollection(collectionId).subscribe();
    this.homePageService.removeLastUsedCollection(collectionId).subscribe();
    this.homePageService.removeLastUsedDocuments(collectionId).subscribe();
    this.homePageService.removeFavoriteDocuments(collectionId).subscribe();
    return this.httpClient.delete(
      `${this.apiPrefix()}/${collectionId}`,
      {observe: 'response', responseType: 'text'}
    ).pipe(
      map(() => collectionId),
      catchError(this.handleError)
    );
  }

  public toggleCollectionFavorite(collection: Collection): Observable<boolean> {
    if (collection.favorite) {
      return this.homePageService.removeFavoriteCollection(collection.id);
    }
    return this.homePageService.addFavoriteCollection(collection.id);
  }

  public getCollection(collectionId: string): Observable<Collection> {
    return this.httpClient.get<Collection>(`${this.apiPrefix()}/${collectionId}`).pipe(
      catchError(CollectionService.handleGlobalError),
      switchMap(collection => this.homePageService.checkFavoriteCollection(collection))
    );
  }

  public getLastUsedCollections(): Observable<Collection[]> {
    return this.homePageService.getLastUsedCollections().pipe(
      switchMap(ids => this.convertIdsToCollections(ids))
    );
  }

  public getFavoriteCollections(): Observable<Collection[]> {
    return this.homePageService.getFavoriteCollections().pipe(
      switchMap(ids => this.convertIdsToCollections(ids))
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

  public getAllCollectionNames(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.apiPrefix()}/names`);
  }

  /**
   * @deprecated Get attributes from collection instead.
   */
  public getAttributes(collectionId: string): Observable<Attribute[]> {
    return this.httpClient.get<Attribute[]>(`${this.apiPrefix()}/${collectionId}/attributes`).pipe(
      catchError(CollectionService.handleGlobalError)
    );
  }

  public updateAttribute(collectionId: string, fullName: string, attribute: Attribute): Observable<Attribute> {
    this.homePageService.addLastUsedCollection(collectionId).subscribe();
    return this.httpClient.put<Attribute>(`${this.apiPrefix()}/${collectionId}/attributes/${fullName}`, this.attributeToDto(attribute)).pipe(
      catchError(CollectionService.handleGlobalError)
    );
  }

  public removeAttribute(collectionId: string, fullName: string): Observable<HttpResponse<any>> {
    this.homePageService.addLastUsedCollection(collectionId).subscribe();
    return this.httpClient.delete(
      `${this.apiPrefix()}/${collectionId}/attributes/${fullName}`,
      {observe: 'response', responseType: 'text'}
    );
  }

  protected actualApiPrefix() {
    const collectionId = this.workspace.collectionId;

    return `${this.apiPrefix()}/${collectionId}`;
  }

  private toDto(collection: Collection): Collection {
    let dtoAttributes = [];
    if (collection.attributes) {
      dtoAttributes = collection.attributes.map(this.attributeToDto);
    }

    // TODO send description to the server too
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

  private convertIdsToCollections(ids: string[]): Observable<Collection[]> {
    return Observable.combineLatest(ids.map(id => this.getCollection(id)));
  }
}
