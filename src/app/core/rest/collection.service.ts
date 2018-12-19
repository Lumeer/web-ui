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

import {HttpClient, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {environment} from '../../../environments/environment';
import {AttributeDto, CollectionDto} from '../dto';
import {AppState} from '../store/app.state';
import {PermissionService} from './permission.service';
import {Workspace} from '../store/navigation/workspace';

@Injectable()
export class CollectionService extends PermissionService {
  constructor(protected httpClient: HttpClient, protected store: Store<AppState>) {
    super(httpClient, store);
  }

  public createCollection(collection: CollectionDto, correlationId?: string): Observable<CollectionDto> {
    let headers = new HttpHeaders();
    if (correlationId) {
      headers = headers.set('correlation_id', correlationId);
    }
    return this.httpClient.post<CollectionDto>(this.apiPrefix(), collection, {headers});
  }

  public updateCollection(collection: CollectionDto): Observable<CollectionDto> {
    return this.httpClient.put<CollectionDto>(`${this.apiPrefix()}/${collection.id}`, collection);
  }

  public removeCollection(collectionId: string): Observable<string> {
    return this.httpClient
      .delete(`${this.apiPrefix()}/${collectionId}`, {observe: 'response', responseType: 'text'})
      .pipe(map(() => collectionId));
  }

  public addFavorite(collectionId: string): Observable<any> {
    return this.httpClient.post(`${this.apiPrefix()}/${collectionId}/favorite`, {});
  }

  public removeFavorite(collectionId: string): Observable<any> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionId}/favorite`);
  }

  public getCollection(collectionId: string): Observable<CollectionDto> {
    return this.httpClient.get<CollectionDto>(`${this.apiPrefix()}/${collectionId}`);
  }

  public getCollections(pageNumber?: number, pageSize?: number): Observable<CollectionDto[]> {
    let queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams = queryParams.set('page', pageNumber.toString()).set('size', pageSize.toString());
    }
    queryParams = queryParams.set('fromViews', 'true');

    return this.httpClient.get<CollectionDto[]>(this.apiPrefix(), {params: queryParams});
  }

  public setDefaultAttribute(collectionId: string, attributeId: string): Observable<any> {
    return this.httpClient.put(`${this.apiPrefix()}/${collectionId}/attributes/${attributeId}/default`, {});
  }

  /**
   * @deprecated Get attributes from collection instead.
   */
  public getAttributes(collectionId: string): Observable<AttributeDto[]> {
    return this.httpClient.get<AttributeDto[]>(`${this.apiPrefix()}/${collectionId}/attributes`);
  }

  public createAttribute(collectionId: string, attribute: AttributeDto): Observable<AttributeDto> {
    return this.httpClient
      .post<AttributeDto[]>(`${this.apiPrefix()}/${collectionId}/attributes`, [attribute])
      .pipe(map(attributes => attributes[0]));
  }

  public createAttributes(collectionId: string, attributes: AttributeDto[]): Observable<AttributeDto[]> {
    return this.httpClient.post<AttributeDto[]>(`${this.apiPrefix()}/${collectionId}/attributes`, attributes);
  }

  public updateAttribute(collectionId: string, id: string, attribute: AttributeDto): Observable<AttributeDto> {
    return this.httpClient.put<AttributeDto>(`${this.apiPrefix()}/${collectionId}/attributes/${id}`, attribute);
  }

  public removeAttribute(collectionId: string, id: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionId}/attributes/${id}`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const actualWorkspace = workspace || this.workspace;
    const collectionId = actualWorkspace.collectionId;

    return `${this.apiPrefix()}/${collectionId}`;
  }

  private apiPrefix(): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `${environment.apiUrl}/rest/organizations/${organizationCode}/projects/${projectCode}/collections`;
  }
}
