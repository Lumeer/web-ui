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

import {Project} from '../dto/project';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {Permissions} from '../dto/permissions';
import {Permission} from '../dto/permission';
import {WorkspaceService} from '../workspace.service';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {BadInputError} from '../error/bad-input.error';
import {LumeerError} from '../error/lumeer.error';

@Injectable()
export class ProjectService {

  constructor(private httpClient: HttpClient,
    private workspaceService: WorkspaceService) {
  }

  public getProjects(orgCode: string): Observable<Project[]> {
    return this.httpClient.get<Project[]>(this.apiPrefix(orgCode));
  }

  public getProject(orgCode: string, projCode: string): Observable<Project> {
    return this.httpClient.get<Project>(this.apiPrefix(orgCode, projCode));
  }

  public deleteProject(orgCode: string, projCode: string): Observable<HttpResponse<object>> {
    return this.httpClient.delete(this.apiPrefix(orgCode, projCode), {observe: 'response'});
  }

  public createProject(orgCode: string, project: Project): Observable<HttpResponse<object>> {
    return this.httpClient.post(this.apiPrefix(orgCode), project, {observe: 'response'});
  }

  public editProject(orgCode: string, projCode: string, project: Project): Observable<HttpResponse<object>> {
    return this.httpClient.put(this.apiPrefix(orgCode, projCode), project, {observe: 'response'});
  }

  public getPermissions(): Observable<Permissions> {
    let orgCode = this.workspaceService.actualOrganizationCode;
    let projCode = this.workspaceService.actualProjectCode;
    return this.httpClient.get<Permissions>(`${this.apiPrefix(orgCode, projCode)}/permissions`)
      .catch(ProjectService.handleGlobalError);
  }

  public updateUserPermission(userPermissions: Permission): Observable<Permission> {
    let code = this.workspaceService.actualOrganizationCode;
    let projCode = this.workspaceService.actualProjectCode;
    return this.httpClient.put<Permission>(`${this.apiPrefix(code, projCode)}/permissions/users`, userPermissions)
      .catch(ProjectService.handleGlobalError);
  }

  public updateGroupPermission(userPermissions: Permission): Observable<Permission> {
    let code = this.workspaceService.actualOrganizationCode;
    let projCode = this.workspaceService.actualProjectCode;
    return this.httpClient.put<Permission>(`${this.apiPrefix(code, projCode)}/permissions/groups`, userPermissions)
      .catch(ProjectService.handleGlobalError);
  }

  public removeUserPermission(user: string): Observable<Permission> {
    let code = this.workspaceService.actualOrganizationCode;
    let projCode = this.workspaceService.actualProjectCode;
    return this.httpClient.delete(`${this.apiPrefix(code, projCode)}/permissions/users/${user}`, {observe: 'response'})
      .catch(ProjectService.handleGlobalError);
  }

  public removeGroupPermission(group: string): Observable<Permission> {
    let code = this.workspaceService.actualOrganizationCode;
    let projCode = this.workspaceService.actualProjectCode;
    return this.httpClient.delete(`${this.apiPrefix(code, projCode)}/permissions/groups/${group}`, {observe: 'response'})
      .catch(ProjectService.handleGlobalError);
  }

  private apiPrefix(orgCode: string, projCode?: string): string {
    return `/${API_URL}/rest/organizations/${orgCode}/projects${projCode ? `/${projCode}` : ''}`;
  }

  private static handleError(error: HttpErrorResponse): ErrorObservable {
    if (error.status === 400) {
      throw new BadInputError('Name already exists');
    }
    return ProjectService.handleGlobalError(error);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
