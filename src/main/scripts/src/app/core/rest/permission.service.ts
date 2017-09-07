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
