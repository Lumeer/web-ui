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
  public getProjects(organizationId: string): Observable<ProjectDto[]> {
    return this.httpClient.get<ProjectDto[]>(this.apiPrefix(organizationId));
  }

  public getProjectCodes(organizationId: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.apiPrefix(organizationId)}/info/codes`).pipe();
  }

  public getProject(organizationId: string, projectId: string): Observable<ProjectDto> {
    return this.httpClient.get<ProjectDto>(this.apiPrefix(organizationId, projectId));
  }

  public getProjectByCode(organizationId: string, projectCode: string): Observable<ProjectDto> {
    return this.httpClient.get<ProjectDto>(`${this.apiPrefix(organizationId)}/code/${projectCode}`);
  }

  public deleteProject(organizationId: string, projectId: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(this.apiPrefix(organizationId, projectId), {
      observe: 'response',
      responseType: 'text',
    });
  }

  public createProject(organizationId: string, project: ProjectDto): Observable<ProjectDto> {
    return this.httpClient.post<ProjectDto>(this.apiPrefix(organizationId), project);
  }

  public updateProject(organizationId: string, projectId: string, project: ProjectDto): Observable<ProjectDto> {
    return this.httpClient.put<ProjectDto>(this.apiPrefix(organizationId, projectId), project);
  }

  private apiPrefix(organizationId: string, projectId?: string): string {
    return `${environment.apiUrl}/rest/organizations/${organizationId}/projects${projectId ? `/${projectId}` : ''}`;
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return this.apiPrefix(organizationId, projectId);
  }
}
