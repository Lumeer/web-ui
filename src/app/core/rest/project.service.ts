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
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';

import {Project} from '../dto/project';
import {Observable} from 'rxjs/Observable';
import {PermissionService} from './permission.service';
import {FetchFailedError} from '../error/fetch-failed.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {NetworkError} from '../error/network.error';
import {catchError} from 'rxjs/operators';

@Injectable()
export class ProjectService extends PermissionService {

  public getProjects(orgCode: string): Observable<Project[]> {
    return this.httpClient.get<Project[]>(this.apiPrefix(orgCode)).pipe(
      catchError(ProjectService.catchGetProjectsError)
    );
  }

  public getProject(orgCode: string, projCode: string): Observable<Project> {
    return this.httpClient.get<Project>(this.apiPrefix(orgCode, projCode));
  }

  public deleteProject(orgCode: string, projCode: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(this.apiPrefix(orgCode, projCode), {observe: 'response', responseType: 'text'});
  }

  public createProject(orgCode: string, project: Project): Observable<HttpResponse<any>> {
    return this.httpClient.post(this.apiPrefix(orgCode), project, {observe: 'response', responseType: 'text'});
  }

  public editProject(orgCode: string, projCode: string, project: Project): Observable<HttpResponse<any>> {
    return this.httpClient.put(this.apiPrefix(orgCode, projCode), project, {observe: 'response', responseType: 'text'});
  }

  private apiPrefix(orgCode: string, projCode?: string): string {
    return `/${API_URL}/rest/organizations/${orgCode}/projects${projCode ? `/${projCode}` : ''}`;
  }

  protected actualApiPrefix(): string {
    let orgCode = this.workspace.organizationCode;
    let projCode = this.workspace.projectCode;

    return this.apiPrefix(orgCode, projCode);
  }

  private static catchGetProjectsError(error: HttpErrorResponse): ErrorObservable {
    if (error instanceof Error) {
      throw new NetworkError();
    } else {
      throw new FetchFailedError('Projects');
    }
  }
}
