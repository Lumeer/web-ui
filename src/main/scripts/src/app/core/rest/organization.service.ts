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
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';

import {Organization} from '../dto/organization';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {PermissionService} from './permission.service';
import {FetchFailedError} from '../error/fetch-failed.error';
import {NetworkError} from '../error/network.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';

@Injectable()
export class OrganizationService extends PermissionService {

  public getOrganizations(): Observable<Organization[]> {
    return this.httpClient.get<Organization[]>(this.apiPrefix())
      .catch(OrganizationService.catchGetCollectionsError);
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.httpClient.get<Organization>(this.apiPrefix(code));
  }

  public deleteOrganization(code: string): Observable<HttpResponse<object>> {
    return this.httpClient.delete(this.apiPrefix(code), {observe: 'response'});
  }

  public createOrganization(organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.post(this.apiPrefix(), organization, {observe: 'response'});
  }

  public editOrganization(code: string, organization: Organization): Observable<HttpResponse<object>> {
    return this.httpClient.put(this.apiPrefix(code), organization, {observe: 'response'});
  }

  protected actualApiPrefix(): string {
    let orgCode = this.workspaceService.organizationCode;

    return this.apiPrefix(orgCode);
  }

  private apiPrefix(code?: string): string {
    return `/${API_URL}/rest/organizations${code ? `/${code}` : ''}`;
  }

  private static catchGetCollectionsError(error: HttpErrorResponse): ErrorObservable {
    if (error instanceof Error) {
      throw new NetworkError();
    } else {
      throw new FetchFailedError('Organizations');
    }
  }

}
