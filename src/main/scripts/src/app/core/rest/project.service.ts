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
import {HttpResponse} from '@angular/common/http';

import {Project} from '../dto/project';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {PermissionService} from './permission.service';

@Injectable()
export class ProjectService extends PermissionService {

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

  private apiPrefix(orgCode: string, projCode?: string): string {
    return `/${API_URL}/rest/organizations/${orgCode}/projects${projCode ? `/${projCode}` : ''}`;
  }

  protected actualApiPrefix(): string {
    let orgCode = this.workspaceService.organizationCode;
    let projCode = this.workspaceService.projectCode;

    return this.apiPrefix(orgCode, projCode);
  }
}
