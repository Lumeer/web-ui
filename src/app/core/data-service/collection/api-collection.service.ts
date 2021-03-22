/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {CollectionService} from './collection.service';
import {AppState} from '../../store/app.state';
import {AttributeDto, CollectionDto} from '../../dto';
import {ApiPermissionService} from '../common/api-permission.service';
import {Workspace} from '../../store/navigation/workspace';
import {CollectionPurposeDto} from '../../dto/collection.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiCollectionService extends ApiPermissionService implements CollectionService {
  constructor(
    protected httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(httpClient, store$);
  }

  public createCollection(collection: CollectionDto): Observable<CollectionDto> {
    return this.httpClient.post<CollectionDto>(this.apiPrefix(), collection);
  }

  public updateCollection(collection: CollectionDto): Observable<CollectionDto> {
    return this.httpClient.put<CollectionDto>(`${this.apiPrefix()}/${collection.id}`, collection);
  }

  public updatePurpose(
    collectionId: string,
    purpose: CollectionPurposeDto,
    workspace?: Workspace
  ): Observable<CollectionDto> {
    return this.httpClient.put<CollectionDto>(`${this.apiPrefix(workspace)}/${collectionId}/purpose`, purpose);
  }

  public removeCollection(collectionId: string): Observable<string> {
    return this.httpClient
      .delete(`${this.apiPrefix()}/${collectionId}`, {observe: 'response', responseType: 'text'})
      .pipe(map(() => collectionId));
  }

  public addFavorite(collectionId: string, workspace?: Workspace): Observable<any> {
    return this.httpClient.post(`${this.apiPrefix(workspace)}/${collectionId}/favorite`, {});
  }

  public removeFavorite(collectionId: string, workspace?: Workspace): Observable<any> {
    return this.httpClient.delete(`${this.apiPrefix(workspace)}/${collectionId}/favorite`);
  }

  public getCollection(collectionId: string): Observable<CollectionDto> {
    return this.httpClient.get<CollectionDto>(`${this.apiPrefix()}/${collectionId}`);
  }

  public getCollections(workspace?: Workspace): Observable<CollectionDto[]> {
    const queryParams = new HttpParams().append('fromViews', 'true');
    return this.httpClient.get<CollectionDto[]>(this.apiPrefix(workspace), {params: queryParams});
  }

  public setDefaultAttribute(collectionId: string, attributeId: string): Observable<any> {
    return this.httpClient.put(`${this.apiPrefix()}/${collectionId}/attributes/${attributeId}/default`, {});
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

  public runRule(collectionId: string, ruleId: string): Observable<any> {
    return this.httpClient.post(`${this.apiPrefix()}/${collectionId}/rule/${ruleId}`, {});
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const actualWorkspace = workspace || this.workspace;
    const collectionId = actualWorkspace.collectionId;

    return `${this.apiPrefix(workspace)}/${collectionId}`;
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/collections`;
  }
}
