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

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {LinkType} from '../dto/link-type';
import {Query} from '../dto/query';
import {LumeerError} from '../error/lumeer.error';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

const LINK_TYPES = 'linkTypes';

@Injectable()
export class LinkTypeService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkType(linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkType.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkTypes[linkType.id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType);
  }

  public updateLinkType(id: string, linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkTypes[id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType);
  }

  public deleteLinkType(id: string): Observable<string> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    delete linkTypes[id];

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(id);
  }

  public getLinkTypes(query: Query): Observable<LinkType[]> {
    const linkTypesMap: { [id: string]: LinkType } = LocalStorage.get(LINK_TYPES) || {};
    let linkTypes = Object.values(linkTypesMap);

    if (query && query.linkTypeIds && query.linkTypeIds.length) {
      linkTypes = linkTypes.filter(linkType => query.linkTypeIds.includes(linkType.id));
    }

    if (query && query.collectionCodes && query.collectionCodes.length) {
      linkTypes = linkTypes.filter(linkType => linkType.collectionCodes.some(code => query.collectionCodes.includes(code)));
    }

    return Observable.of(linkTypes);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/link-types`;
  }

}
