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
import {Http} from '@angular/http';

import {Project} from '../../shared/project';
import {Observable} from 'rxjs/Observable';
import {HttpJson} from '../../core/http-json.service';

@Injectable()
export class ProjectService {

  constructor(private http: Http,
              private httpJson: HttpJson) {
  }

  public getProject(orgCode: string, projCode: string): Observable<Project> {
    return this.http.get(this.apiPrefix(orgCode, projCode))
      .map(response => response.json() as Project);
  }

  public deleteProject(orgCode: string, projCode: string) {
    this.http.delete(this.apiPrefix(orgCode, projCode))
      .subscribe();
  }

  public createProject(orgCode: string, project: Project) {
    this.httpJson.post(this.apiPrefix(orgCode), JSON.stringify(project))
      .subscribe();
  }

  public editProject(orgCode: string, projCode: string, project: Project) {
    this.httpJson.put(this.apiPrefix(orgCode, projCode), JSON.stringify(project))
      .subscribe();
  }

  private apiPrefix(orgCode: string, projCode?: string): string {
    return '/lumeer-engine/rest/' + orgCode + '/projects' + (projCode ? '/' + projCode : '');
  }

}
