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
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {WorkspaceService} from '../workspace.service';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LumeerError} from '../error/lumeer.error';
import {Observable} from 'rxjs/Observable';
import {LinkType} from '../dto/link-type';

@Injectable()
export class LinkTypeService {

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public getLinkTypes(collectionCode: string): Observable<LinkType[]> {
    const link1: LinkType = {
      fromCollection: collectionCode,
      toCollection: 'ord',
      name: 'Clouds placement',
      instanceCount: 38,
      attributes: []
    };
    const link2: LinkType = {
      fromCollection: collectionCode,
      toCollection: 'cmp',
      name: 'Seasons in the Sun',
      instanceCount: 12628,
      attributes: []
    };
    const link3: LinkType = {
      fromCollection: collectionCode,
      toCollection: 'emp',
      name: 'Pollution clouds',
      instanceCount: 364,
      attributes: [],
      automaticLinkFromAttribute: 'id',
      automaticLinkToAttribute: 'pollution'
    };

    return Observable.of([link1, link2, link3]);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/c/${collectionCode}/linktypes`;
  }

}
