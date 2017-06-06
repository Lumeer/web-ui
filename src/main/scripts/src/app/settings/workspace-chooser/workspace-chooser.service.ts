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

import 'rxjs/add/operator/map';
import {Observable} from 'rxjs/Observable';
import {Organization} from '../../shared/organization';
import {Project} from '../../shared/project';

@Injectable()
export class WorkspaceChooserService {

  public oganizations: Organization[];

  constructor(private http: Http) {
  }

  public fetchOrganizations(): Observable<Organization[]> {
    return this.http.get('/lumeer-engine/rest/organizations')
      .map(response => response.json() as Organization[]);
  }

  public fetchProjects(organization: string): Observable<Project[]> {
    return this.http.get('/lumeer-engine/rest/' + organization + '/projects')
      .map(response => response.json() as Project[]);
  }
}
