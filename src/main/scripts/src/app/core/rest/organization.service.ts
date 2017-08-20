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
import {HttpClient, HttpResponse} from '@angular/common/http';

import {Organization} from '../dto/organization';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class OrganizationService {

  constructor(private httpClient: HttpClient) {
  }

  public getOrganizations(): Observable<Organization[]> {
    return this.httpClient.get<Organization[]>(OrganizationService.apiPrefix());
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.httpClient.get<Organization>(OrganizationService.apiPrefix(code));
  }

  public deleteOrganization(code: string): Observable<HttpResponse<object>> {
    return this.httpClient.delete(OrganizationService.apiPrefix(code), {observe: 'response'});
  }

  public createOrganization(organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.post(OrganizationService.apiPrefix(), organization, {observe: 'response'});
  }

  public editOrganization(code: string, organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.put(OrganizationService.apiPrefix(code), organization, {observe: 'response'});
  }

  private static apiPrefix(code?: string): string {
    return `/${API_URL}/rest/organizations${code ? `/${code}` : ''}`;
  }

}
