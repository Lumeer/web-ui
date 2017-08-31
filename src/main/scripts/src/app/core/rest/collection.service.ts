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
import {Collection} from '../dto/collection';
import {Attribute} from '../dto/attribute';
import {Observable} from 'rxjs/Observable';
import {BadInputError} from '../error/bad-input.error';
import {LumeerError} from '../error/lumeer.error';
import {isNullOrUndefined} from 'util';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import 'rxjs/add/operator/catch';
import {Permissions} from '../dto/permissions';

@Injectable()
export class CollectionService {

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public createCollection(collection: Collection): Observable<HttpResponse<any>> {
    return this.httpClient.post(this.apiPrefix(), collection, {observe: 'response'})
      .catch(CollectionService.handleError);
  }

  public updateCollection(collection: Collection): Observable<Collection> {
    return this.httpClient.put(`${this.apiPrefix()}/${collection.code}`, collection)
      .catch(CollectionService.handleError);
  }

  public removeCollection(collectionCode: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}`, {observe: 'response'})
      .catch(CollectionService.handleError);
  }

  public getCollection(collectionCode: string): Observable<Collection> {
    return this.httpClient.get<Collection>(`${this.apiPrefix()}/${collectionCode}`)
      .catch(CollectionService.handleGlobalError);
  }

  public getCollections(pageNumber?: number, pageSize?: number): Observable<Collection[]> {
    let queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Collection[]>(this.apiPrefix(), {params: queryParams})
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

  public getPermissions(collectionCode: string): Observable<Permissions> {
    return this.httpClient.get<Permissions>(`${this.apiPrefix()}/${collectionCode}/permissions`)
      .catch(CollectionService.handleGlobalError);
  }

  public updateUserPermissions(collectionCode: string, userPermissions: Permissions): Observable<Permissions> {
    return this.httpClient.put<Permissions>(`${this.apiPrefix()}/${collectionCode}/permissions/users`, userPermissions)
      .catch(CollectionService.handleGlobalError);
  }

  public removeUserPermissions(collectionCode: string, user: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}/permissions/users/${user}`, {observe: 'response'})
      .catch(CollectionService.handleGlobalError);
  }

  public updateGroupPermission(collectionCode: string, groupPermissions: Permissions): Observable<Permissions> {
    return this.httpClient.put<Permissions>(`${this.apiPrefix()}/${collectionCode}/permissions/groups`, groupPermissions)
      .catch(CollectionService.handleGlobalError);
  }

  public removeGroupPermission(collectionCode: string, group: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}/permissions/groups/${group}`, {observe: 'response'})
      .catch(CollectionService.handleGlobalError);
  }

  private apiPrefix(): string {
    let organizationCode = this.workspaceService.organizationCode;
    let projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections`;
  }

  private static handleError(error: HttpErrorResponse): ErrorObservable {
    if (error.status === 400) {
      throw new BadInputError('Name already exists');
    }
    return CollectionService.handleGlobalError(error);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
