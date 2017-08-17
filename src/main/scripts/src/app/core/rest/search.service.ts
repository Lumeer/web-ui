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
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import {WorkspaceService} from '../workspace.service';
import {Suggestion} from '../dto/suggestion';

@Injectable()
export class SearchService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public suggest(text: string, type: string): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.searchPath()}/suggestion`,
      {params: new HttpParams().set('text', text).set('type', type)});
  }

  private searchPath(): string {
    let organization = this.workspaceService.organizationCode;
    let project = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organization}/projects/${project}/search`;
  }

}
