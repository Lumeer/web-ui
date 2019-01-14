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
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Store} from '@ngrx/store';

import {PermissionsDto, PermissionDto} from '../dto';
import {Observable} from 'rxjs';
import {Workspace} from '../store/navigation/workspace';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';

@Injectable()
export abstract class PermissionService {
  protected workspace: Workspace;

  constructor(protected httpClient: HttpClient, protected store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => (this.workspace = workspace));
  }

  public getPermissions(): Observable<PermissionsDto> {
    return this.httpClient.get<PermissionsDto>(`${this.actualApiPrefix()}/permissions`);
  }

  public updateUserPermission(userPermissions: PermissionDto[], workspace?: Workspace): Observable<PermissionDto> {
    return this.httpClient.put<PermissionDto>(`${this.actualApiPrefix(workspace)}/permissions/users`, userPermissions);
  }

  public updateGroupPermission(userPermissions: PermissionDto[], workspace?: Workspace): Observable<PermissionDto> {
    return this.httpClient.put<PermissionDto>(`${this.actualApiPrefix(workspace)}/permissions/groups`, userPermissions);
  }

  public removeUserPermission(user: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/users/${user}`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  public removeGroupPermission(group: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/groups/${group}`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  protected abstract actualApiPrefix(workspace?: Workspace): string;
}
