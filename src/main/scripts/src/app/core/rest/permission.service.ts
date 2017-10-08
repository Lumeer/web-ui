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
import {HttpClient, HttpResponse, HttpErrorResponse} from '@angular/common/http';

import {Permissions} from '../dto/permissions';
import {Permission} from '../dto/permission';
import {Observable} from 'rxjs/Observable';
import {WorkspaceService} from '../workspace.service';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';

@Injectable()
export abstract class PermissionService {

  constructor(protected httpClient: HttpClient,
              protected workspaceService: WorkspaceService) {
  }

  public getPermissions(): Observable<Permissions> {
    return this.httpClient.get<Permissions>(`${this.actualApiPrefix()}/permissions`)
      .catch(PermissionService.handleGlobalError);
  }

  public updateUserPermission(userPermissions: Permission): Observable<Permission> {
    return this.httpClient.put<Permission>(`${this.actualApiPrefix()}/permissions/users`, userPermissions)
      .catch(PermissionService.handleGlobalError);
  }

  public updateGroupPermission(userPermissions: Permission): Observable<Permission> {
    return this.httpClient.put<Permission>(`${this.actualApiPrefix()}/permissions/groups`, userPermissions)
      .catch(PermissionService.handleGlobalError);
  }

  public removeUserPermission(user: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/users/${user}`, {observe: 'response'})
      .catch(PermissionService.handleGlobalError);
  }

  public removeGroupPermission(group: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.actualApiPrefix()}/permissions/groups/${group}`, {observe: 'response'})
      .catch(PermissionService.handleGlobalError);
  }

  protected static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  protected abstract actualApiPrefix(): string;
}
