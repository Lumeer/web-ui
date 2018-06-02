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
import {Group} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {isNullOrUndefined} from 'util';
import {filter, map} from 'rxjs/operators';

@Injectable()
export class GroupService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace)
      .pipe(filter(workspace => !isNullOrUndefined(workspace)))
      .subscribe(workspace => this.workspace = workspace);
  }

  public createGroup(group: Group): Observable<Group> {
    return this.httpClient.post<Group>(this.apiPrefix(), group);
  }

  public updateGroup(id: string, group: Group): Observable<Group> {
    return this.httpClient.put<Group>(this.apiPrefix(id), group);
  }

  public deleteGroup(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id), {observe: 'response', responseType: 'text'})
      .pipe(map(() => id));
  }

  public getGroups(): Observable<Group[]> {
    return this.httpClient.get<Group[]>(this.apiPrefix());
  }

  private apiPrefix(groupId?: string): string {
    return `/${environment.apiUrl}/rest/organizations/${this.workspace.organizationCode}/groups${groupId ? `/${groupId}` : ''}`;
  }

}
