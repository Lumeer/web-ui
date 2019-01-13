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

import {HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ProjectDto} from '../dto';
import {PermissionService} from './permission.service';
import {Workspace} from '../store/navigation/workspace';

@Injectable()
export class ProjectService extends PermissionService {
  public getProjects(orgCode: string): Observable<ProjectDto[]> {
    if (!this.hasOrganizationApiPrefix(orgCode)) {
      throw Error('Organization not set');
    }

    return this.httpClient.get<ProjectDto[]>(this.apiPrefix(orgCode));
  }

  public getProjectCodes(orgCode: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.apiPrefix(orgCode)}/info/codes`).pipe();
  }

  public getProject(orgCode: string, projCode: string): Observable<ProjectDto> {
    if (!this.hasFullApiPrefix(orgCode, projCode)) {
      throw Error(`Workspace not set ${orgCode} ${projCode}`);
    }

    return this.httpClient.get<ProjectDto>(this.apiPrefix(orgCode, projCode));
  }

  public deleteProject(orgCode: string, projCode: string): Observable<HttpResponse<any>> {
    if (!this.hasFullApiPrefix(orgCode, projCode)) {
      throw Error(`Workspace not set ${orgCode} ${projCode}`);
    }

    return this.httpClient.delete(this.apiPrefix(orgCode, projCode), {observe: 'response', responseType: 'text'});
  }

  public createProject(orgCode: string, project: ProjectDto): Observable<ProjectDto> {
    if (!this.hasOrganizationApiPrefix(orgCode)) {
      throw Error('Organization not set');
    }

    return this.httpClient.post<ProjectDto>(this.apiPrefix(orgCode), project);
  }

  public editProject(orgCode: string, projCode: string, project: ProjectDto): Observable<ProjectDto> {
    if (!this.hasFullApiPrefix(orgCode, projCode)) {
      throw Error(`Workspace not set ${orgCode} ${projCode}`);
    }
    return this.httpClient.put<ProjectDto>(this.apiPrefix(orgCode, projCode), project);
  }

  private hasOrganizationApiPrefix(orgCode: string): boolean {
    return !!orgCode;
  }

  private hasFullApiPrefix(orgCode: string, projCode: string): boolean {
    return !!(orgCode && projCode);
  }

  private apiPrefix(orgCode: string, projCode?: string): string {
    return `${environment.apiUrl}/rest/organizations/${orgCode}/projects${projCode ? `/${projCode}` : ''}`;
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const actualWorkspace = workspace || this.workspace;
    const orgCode = actualWorkspace.organizationCode;
    const projCode = actualWorkspace.projectCode;

    return this.apiPrefix(orgCode, projCode);
  }
}
