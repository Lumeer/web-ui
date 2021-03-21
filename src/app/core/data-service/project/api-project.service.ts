/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {HttpClient, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiPermissionService} from '../common/api-permission.service';
import {ProjectService} from './project.service';
import {ProjectDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiProjectService extends ApiPermissionService implements ProjectService {
  constructor(
    protected httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(httpClient, store$);
  }

  public getProjects(organizationId: string): Observable<ProjectDto[]> {
    return this.httpClient.get<ProjectDto[]>(this.apiPrefix(organizationId));
  }

  public getProjectCodes(organizationId: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseApiPrefix(organizationId)}/info/codes`).pipe();
  }

  public getProject(organizationId: string, projectId: string): Observable<ProjectDto> {
    return this.httpClient.get<ProjectDto>(this.apiPrefix(organizationId, projectId));
  }

  public getProjectByCode(organizationId: string, projectCode: string): Observable<ProjectDto> {
    return this.httpClient.get<ProjectDto>(`${this.baseApiPrefix(organizationId)}/code/${projectCode}`);
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

  public applyTemplate(organizationId: string, projectId: string, template: string): Observable<any> {
    return this.httpClient.post(`${this.baseApiPrefix(organizationId)}/${projectId}/templates/${template}`, {});
  }

  public createSampleData(organizationId: string, projectId: string, type: string): Observable<any> {
    return this.httpClient.post(`${this.baseApiPrefix(organizationId)}/${projectId}/sample/${type}`, {});
  }

  public copyProject(
    organizationId: string,
    projectId: string,
    copyOrganizationId: string,
    copyProjectId: string
  ): Observable<any> {
    return this.httpClient.post(
      `${this.baseApiPrefix(organizationId)}/${projectId}/copy`,
      {},
      {params: {organizationId: copyOrganizationId, projectId: copyProjectId}}
    );
  }

  public updateProject(organizationId: string, projectId: string, project: ProjectDto): Observable<ProjectDto> {
    return this.httpClient.put<ProjectDto>(this.apiPrefix(organizationId, projectId), project);
  }

  private apiPrefix(organizationId: string, projectId?: string): string {
    return `${this.baseApiPrefix(organizationId)}${projectId ? `/${projectId}` : ''}`;
  }

  private baseApiPrefix(organizationId: string): string {
    return `${this.configurationService.getConfiguration().apiUrl}/rest/organizations/${organizationId}/projects`;
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return this.apiPrefix(organizationId, projectId);
  }
}
