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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {PublicPermissionService} from '../common/public-permission.service';
import {ProjectService} from './project.service';
import {ProjectDto} from '../../dto';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {map, mergeMap, take} from 'rxjs/operators';
import {setDefaultUserPermissions} from '../common/public-api-util';
import {DEFAULT_USER} from '../../constants';
import {Role} from '../../model/role';
import {selectPublicProjectId} from '../../store/public-data/public-data.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class PublicProjectService extends PublicPermissionService implements ProjectService {
  constructor(
    protected httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public getProjects(organizationId: string): Observable<ProjectDto[]> {
    return this.getCurrentPublicProject(organizationId).pipe(map(project => [project]));
  }

  public getProjectCodes(organizationId: string): Observable<string[]> {
    return of([]);
  }

  public getProject(organizationId: string, projectId: string): Observable<ProjectDto> {
    return this.httpClient
      .get<ProjectDto>(this.apiPrefix(organizationId, projectId))
      .pipe(
        map(project =>
          setDefaultUserPermissions(
            project,
            DEFAULT_USER,
            project?.templateMetadata?.editable ? [Role.Read, Role.Write] : [Role.Read]
          )
        )
      );
  }

  private getCurrentPublicProject(organizationId: string): Observable<ProjectDto> {
    return this.store$.pipe(
      select(selectPublicProjectId),
      take(1),
      mergeMap(publicProjectId => this.getProject(organizationId, publicProjectId))
    );
  }

  public getProjectByCode(organizationId: string, projectCode: string): Observable<ProjectDto> {
    return this.getCurrentPublicProject(organizationId);
  }

  public deleteProject(organizationId: string, projectId: string): Observable<any> {
    return of(projectId);
  }

  public createProject(organizationId: string, project: ProjectDto): Observable<ProjectDto> {
    return of(project);
  }

  public applyTemplate(organizationId: string, projectId: string, template: string): Observable<any> {
    return of(template);
  }

  public createSampleData(organizationId: string, projectId: string, type: string): Observable<any> {
    return of(type);
  }

  public copyProject(
    organizationId: string,
    projectId: string,
    copyOrganizationId: string,
    copyProjectId: string
  ): Observable<any> {
    return of(copyProjectId);
  }

  public updateProject(organizationId: string, projectId: string, project: ProjectDto): Observable<ProjectDto> {
    return of(project);
  }

  private apiPrefix(organizationId: string, projectId?: string): string {
    return `${this.baseApiPrefix(organizationId)}${projectId ? `/${projectId}` : ''}`;
  }

  private baseApiPrefix(organizationId: string): string {
    return `${this.configurationService.getConfiguration().apiUrl}/rest/p/organizations/${organizationId}/projects`;
  }
}
