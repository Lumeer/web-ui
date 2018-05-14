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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Store} from '@ngrx/store';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {LinkType, Query} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {filter, map} from 'rxjs/operators';

@Injectable()
export class LinkTypeService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).pipe(
      filter(workspace => !!workspace)
    ).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkType(linkType: LinkType): Observable<LinkType> {
    return this.httpClient.post<LinkType>(this.restApiPrefix(), linkType);
  }

  public updateLinkType(id: string, linkType: LinkType): Observable<LinkType> {
    return this.httpClient.put<LinkType>(this.restApiPrefix(id), linkType);
  }

  public deleteLinkType(id: string): Observable<string> {
    return this.httpClient.delete(this.restApiPrefix(id))
      .pipe(map(() => id));
  }

  public getLinkTypes(query: Query): Observable<LinkType[]> {
    return this.httpClient.post<LinkType[]>(this.restApiPrefix() + '/search', query);
  }

  private restApiPrefix(id?: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;
    const suffix = id ? `/${id}` : '';

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/link-types${suffix}`;
  }

}
