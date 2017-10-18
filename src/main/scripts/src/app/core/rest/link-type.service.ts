/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
    linkedAttributes: []
  };

  public static link2: LinkType = {
    fromCollection: '',
    toCollection: 'cmp',
    name: 'Seasons in the Sun',
    linkedAttributes: []
  };

  public static link3: LinkType = {
    fromCollection: '',
    toCollection: 'emp',
    name: 'Pollution clouds',
    linkedAttributes: []
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

  public createLinkType(collectionCode: string, linkType: LinkType): Observable<LinkType> {
    return Observable.of(linkType);
  }

  public updateLinkType(collectionCode: string, initialName: string, linkType: LinkType): Observable<LinkType> {
    return Observable.of(linkType);
  }

  public removeLinkType(collectionCode: string, linkType: LinkType): Observable<HttpEvent<any>> {
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
