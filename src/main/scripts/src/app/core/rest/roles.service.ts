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
import {HttpClient} from './http-client.service';

import {Response, RequestOptions, URLSearchParams} from '@angular/http';

import {Role} from '../dto/role';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class RolesService {

  constructor(private http: HttpClient) {
  }

  public getOrganizationRoles(orgCode: string): Observable<Role[]> {
    return this.http.get(RolesService.apiPrefix(orgCode))
      .map(response => response.json() as Role[]);
  }

  public getProjectRoles(orgCode: string, projectCode: string): Observable<Role[]> {
    return this.http.get(RolesService.apiPrefix(orgCode, projectCode))
      .map(response => response.json() as Role[]);
  }

  public addOrganizationUsersGroupsRole(orgCode: string, role: string, users: string[], groups: string[]): Observable<Response> {
    let params: URLSearchParams = this.setParameters(users, groups);
    let options = new RequestOptions({search: params});
    let resp = this.http.put(RolesService.apiPrefix(orgCode) + '/' + role, {}, options);
    return resp;
  }

  public removeOrganizationUsersGroupsRole(orgCode: string, role: string, users: string[], groups: string[]): Observable<Response> {
    let params: URLSearchParams = this.setParameters(users, groups);
    let options = new RequestOptions({search: params});
    return this.http.delete(RolesService.apiPrefix(orgCode) + '/' + role, options);
  }

  public addProjectUsersGroupsRole(orgCode: string, projectCode: string, role: string, users: string[], groups: string[]): Observable<Response> {
    let params: URLSearchParams = this.setParameters(users, groups);
    let options = new RequestOptions({search: params});
    let resp = this.http.put(RolesService.apiPrefix(orgCode, projectCode) + '/' + role, {}, options);
    return resp;
  }

  public removeProjectUsersGroupsRole(orgCode: string, projectCode: string, role: string, users: string[], groups: string[]): Observable<Response> {
    let params: URLSearchParams = this.setParameters(users, groups);
    let options = new RequestOptions({search: params});
    return this.http.delete(RolesService.apiPrefix(orgCode, projectCode) + '/' + role, options);
  }

  private static apiPrefix(organizationCode: string, projCode?: string): string {
    return `/lumeer-engine/rest/roles/organizations/${organizationCode}` + (projCode ? `/projects/` + projCode : ``) + `/roles`;
  }

  private setParameters(users: string[], groups: string[]): URLSearchParams {
    let params: URLSearchParams = new URLSearchParams();
    for (let u in users) {
      if (users.hasOwnProperty(u)) {
        params.append('users', users[u]);
      }
    }
    for (let g in groups) {
      if (groups.hasOwnProperty(g)) {
        params.append('groups', groups[g]);
      }
    }
    return params;
  }

}
