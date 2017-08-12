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
import {Response} from '@angular/http';
import {Project} from '../dto/project';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';

@Injectable()
export class ProjectService {

  constructor(private httpClient: HttpClient) {
  }

  public getProjects(orgCode: string): Observable<Project[]> {
    return this.httpClient.get<Project[]>(ProjectService.apiPrefix(orgCode));
  }

  public getProject(orgCode: string, projCode: string): Observable<Project> {
    return this.httpClient.get<Project>(ProjectService.apiPrefix(orgCode, projCode));
  }

  public deleteProject(orgCode: string, projCode: string): Observable<Response> {
    return this.httpClient.delete(ProjectService.apiPrefix(orgCode, projCode));
  }

  public createProject(orgCode: string, project: Project): Observable<Response> {
    return this.httpClient.post(ProjectService.apiPrefix(orgCode), project);
  }

  public editProject(orgCode: string, projCode: string, project: Project): Observable<Response> {
    return this.httpClient.put(ProjectService.apiPrefix(orgCode, projCode), project);
  }

  private static apiPrefix(orgCode: string, projCode?: string): string {
    return '/lumeer-engine/rest/organizations/' + orgCode + '/projects' + (projCode ? '/' + projCode : '');
  }

}
