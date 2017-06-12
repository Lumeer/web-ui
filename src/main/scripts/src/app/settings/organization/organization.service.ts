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

import {Organization} from '../../shared/dto/organization';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '../../core/http-client.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class OrganizationService {

  constructor(private httpClient: HttpClient) {
  }

  public getOrganizations(): Observable<Organization[]> {
    return this.httpClient.get(OrganizationService.apiPrefix())
      .map(response => response.json() as Organization[])
      .catch(this.handleError);
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.httpClient.get(OrganizationService.apiPrefix(code))
      .map(response => response.json() as Organization)
      .catch(this.handleError);
  }

  public deleteOrganization(code: string): Observable<Response> {
    return this.httpClient.delete(OrganizationService.apiPrefix(code))
      .catch(this.handleError);
  }

  public createOrganization(organization: Organization): Observable<Response> {
    return this.httpClient.post(OrganizationService.apiPrefix(), JSON.stringify(organization))
      .catch(this.handleError);
  }

  public editOrganization(code: string, organization: Organization): Observable<Response> {
    return this.httpClient.put(OrganizationService.apiPrefix(code), JSON.stringify(organization))
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

  private static apiPrefix(code?: string): string {
    return '/lumeer-engine/rest/organizations' + (code ? '/' + code : '');
  }

}
