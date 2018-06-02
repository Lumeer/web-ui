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
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {LinkInstance, Query} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {map} from 'rxjs/operators';

@Injectable()
export class LinkInstanceService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkInstance(linkInstance: LinkInstance): Observable<LinkInstance> {
    return this.httpClient.post<LinkInstance>(this.restApiPrefix(), linkInstance);
  }

  public updateLinkInstance(id: string, linkInstance: LinkInstance): Observable<LinkInstance> {
    return this.httpClient.put<LinkInstance>(this.restApiPrefix(id), linkInstance);
  }

  public deleteLinkInstance(id: string): Observable<string> {
    return this.httpClient.delete(this.restApiPrefix(id))
      .pipe(map(() => id));
  }

  public getLinkInstances(query: Query): Observable<LinkInstance[]> {
    return this.httpClient.post<LinkInstance[]>(this.restApiPrefix() + '/search', query);
  }

  private restApiPrefix(id?: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;
    const suffix = id ? `/${id}` : '';

    return `/${environment.apiUrl}/rest/organizations/${organizationCode}/projects/${projectCode}/link-instances${suffix}`;
  }

}
