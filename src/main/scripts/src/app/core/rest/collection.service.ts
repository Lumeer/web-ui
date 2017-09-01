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
import {HttpErrorResponse, HttpParams, HttpResponse} from '@angular/common/http';

import {Collection} from '../dto/collection';
import {Attribute} from '../dto/attribute';
import {Observable} from 'rxjs/Observable';
import {BadInputError} from '../error/bad-input.error';
import {isNullOrUndefined} from 'util';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import 'rxjs/add/operator/catch';
import {PermissionService} from './permission.service';

@Injectable()
export class CollectionService extends PermissionService {

  public createCollection(collection: Collection): Observable<HttpResponse<any>> {
    return this.httpClient.post(this.apiPrefix(), this.toDto(collection), {observe: 'response'})
      .catch(this.handleError);
  }

  public updateCollection(collection: Collection): Observable<Collection> {
    return this.httpClient.put(`${this.apiPrefix()}/${collection.code}`, this.toDto(collection))
      .map(this.toDto)
      .catch(this.handleError);
  }

  public removeCollection(collectionCode: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}`, {observe: 'response'})
      .catch(this.handleError);
  }

  public getCollection(collectionCode: string): Observable<Collection> {
    return this.httpClient.get<Collection>(`${this.apiPrefix()}/${collectionCode}`)
      .catch(CollectionService.handleGlobalError);
  }

  public getCollections(pageNumber?: number, pageSize?: number): Observable<Collection[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Collection[]>(this.apiPrefix(), {params: queryParams})
      .map(collections => collections.map(this.toDto))
      .catch(CollectionService.handleGlobalError);
  }

  /**
   * @deprecated Get attributes from collection instead.
   */
  public getAttributes(collectionCode: string): Observable<Attribute[]> {
    return this.httpClient.get<Attribute[]>(`${this.apiPrefix()}/${collectionCode}/attributes`)
      .catch(CollectionService.handleGlobalError);
  }

  public updateAttribute(collectionCode: string, fullName: string, attribute: Attribute): Observable<Attribute> {
    return this.httpClient.put<Attribute>(`${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`, attribute)
      .catch(CollectionService.handleGlobalError);
  }

  public removeAttribute(collectionCode: string, fullName: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`, {observe: 'response'});
  }

  protected actualApiPrefix() {
    let collectionCode = this.workspaceService.collectionCode;

    return `${this.apiPrefix()}/${collectionCode}`;
  }

  private toDto(collection: Collection): Collection {
    return {
      code: collection.code,
      name: collection.name,
      color: collection.color,
      icon: collection.icon,
      permissions: collection.permissions,
      attributes: collection.attributes
    };
  }

  private apiPrefix(): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections`;
  }

  private handleError(error: HttpErrorResponse): ErrorObservable {
    if (error.status === 400) {
      throw new BadInputError('Name already exists');
    }
    return CollectionService.handleGlobalError(error);
  }

}
