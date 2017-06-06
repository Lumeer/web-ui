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

import {Organization} from '../../shared/organization';
import {Observable} from 'rxjs/Observable';
import {HttpJson} from '../../core/http-json.service';

@Injectable()
export class OrganizationService {

  constructor(private http: Http,
              private httpJson: HttpJson) {
  }

  public getOrganization(code: string): Observable<Organization> {
    return this.http.get(this.apiPrefix(code))
      .map(response => response.json() as Organization);
  }

  public deleteOrganization(code: string) {
    this.http.delete(this.apiPrefix(code))
      .subscribe();
  }

  public createOrganization(organization: Organization) {
    this.httpJson.post(this.apiPrefix(), JSON.stringify(organization))
      .subscribe();
  }

  public editOrganization(code: string, organization: Organization) {
    this.httpJson.put(this.apiPrefix(code), JSON.stringify(organization))
      .subscribe();
  }

  private apiPrefix(code?: string): string {
    return '/lumeer-engine/rest/organizations' + (code ? '/' + code : '');
  }

}
