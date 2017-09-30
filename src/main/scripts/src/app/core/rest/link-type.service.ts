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
import {HttpClient, HttpErrorResponse, HttpEvent} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {LumeerError} from '../error/lumeer.error';
import {LinkType} from '../dto/link-type';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Observable} from 'rxjs/Observable';

// TODO implement on backend
@Injectable()
export class LinkTypeService {

  public static link1: LinkType = {
    fromCollection: '',
    toCollection: 'ord',
    name: 'Clouds placement',
    instanceCount: 38,
    attributes: []
  };

  public static link2: LinkType = {
    fromCollection: '',
    toCollection: 'cmp',
    name: 'Seasons in the Sun',
    instanceCount: 12628,
    attributes: []
  };

  public static link3: LinkType = {
    fromCollection: '',
    toCollection: 'emp',
    name: 'Pollution clouds',
    instanceCount: 364,
    attributes: [],
    automaticLinkFromAttribute: 'id',
    automaticLinkToAttribute: 'pollution'
  };

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public getLinkTypes(collectionCode: string): Observable<LinkType[]> {
    LinkTypeService.link1.fromCollection = collectionCode;
    LinkTypeService.link2.fromCollection = collectionCode;
    LinkTypeService.link3.fromCollection = collectionCode;

    return Observable.of([LinkTypeService.link1, LinkTypeService.link2, LinkTypeService.link3]
      .filter(linkType => linkType.toCollection !== collectionCode));
  }

  public createLinkType(linkType: LinkType): Observable<LinkType> {
    return Observable.of(linkType);
  }

  public updateLinkType(collectionCode: string, linkTypeName: string, linkType: LinkType): Observable<LinkType> {
    return Observable.of(linkType);
  }

  public removeLinkType(linkType: LinkType): Observable<HttpEvent<any>> {
    return Observable.of(null);
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
