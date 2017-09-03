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
import {HttpClient, HttpResponse, HttpErrorResponse} from '@angular/common/http';

import {Organization} from '../dto/organization';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {Permissions} from '../dto/permissions';
import {Permission} from '../dto/permission';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {BadInputError} from '../error/bad-input.error';
import {WorkspaceService} from '../workspace.service';

@Injectable()
export class OrganizationService {

  constructor(private httpClient: HttpClient,
    private workspaceService: WorkspaceService) {
  }

  public getOrganizations(): Observable<Organization[]> {
    return this.httpClient.get<Organization[]>(this.apiPrefix());
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.httpClient.get<Organization>(this.apiPrefix(code));
  }

  public deleteOrganization(code: string): Observable<HttpResponse<object>> {
    return this.httpClient.delete(this.apiPrefix(code), {observe: 'response'});
  }

  public createOrganization(organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.post(this.apiPrefix(), organization, {observe: 'response'});
  }

  public editOrganization(code: string, organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.put(this.apiPrefix(code), organization, {observe: 'response'});
  }

  public getPermissions(): Observable<Permissions> {
    return this.httpClient.get<Permissions>(`${this.actualApiPrefix()}/permissions`)
      .catch(OrganizationService.handleGlobalError);
  }

  public updateUserPermission(userPermissions: Permission): Observable<Permission> {
    return this.httpClient.put<Permission>(`${this.actualApiPrefix()}/permissions/users`, userPermissions)
      .catch(OrganizationService.handleGlobalError);
  }

  public updateGroupPermission(userPermissions: Permission): Observable<Permission> {
    return this.httpClient.put<Permission>(`${this.actualApiPrefix()}/permissions/groups`, userPermissions)
      .catch(OrganizationService.handleGlobalError);
  }

  public removeUserPermission(user: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/users/${user}`, {observe: 'response'})
      .catch(OrganizationService.handleGlobalError);
  }

  public removeGroupPermission(group: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/groups/${group}`, {observe: 'response'})
      .catch(OrganizationService.handleGlobalError);
  }

  private actualApiPrefix(): string {
    let orgCode = this.workspaceService.currentlySelectedOrganizationCode;
    return `/${API_URL}/rest/organizations/${orgCode}`;
  }

  private apiPrefix(code?: string): string {
    return `/${API_URL}/rest/organizations${code ? `/${code}` : ''}`;
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
