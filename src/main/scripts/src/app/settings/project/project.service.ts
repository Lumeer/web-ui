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

import {Project} from '../../shared/dto/project';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '../../core/http-client.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class ProjectService {

  constructor(private httpClient: HttpClient) {
  }

  public getProjects(orgCode: string): Observable<Project[]> {
    return this.httpClient.get(ProjectService.apiPrefix(orgCode))
      .map(response => response.json() as Project[])
      .catch(this.handleError);
  }

  public getProject(orgCode: string, projCode: string): Observable<Project> {
    return this.httpClient.get(ProjectService.apiPrefix(orgCode, projCode))
      .map(response => response.json() as Project)
      .catch(this.handleError);
  }

  public deleteProject(orgCode: string, projCode: string): Observable<Response> {
    return this.httpClient.delete(ProjectService.apiPrefix(orgCode, projCode))
      .catch(this.handleError);
  }

  public createProject(orgCode: string, project: Project): Observable<Response> {
    return this.httpClient.post(ProjectService.apiPrefix(orgCode), JSON.stringify(project))
      .catch(this.handleError);
  }

  public editProject(orgCode: string, projCode: string, project: Project): Observable<Response> {
    return this.httpClient.put(ProjectService.apiPrefix(orgCode, projCode), JSON.stringify(project))
      .catch(this.handleError);
  }

  private handleError(error: Response | any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      errMsg = `${error.statusText || 'Error!'}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

  private static apiPrefix(orgCode: string, projCode?: string): string {
    return '/lumeer-engine/rest/' + orgCode + '/projects' + (projCode ? '/' + projCode : '');
  }

}
