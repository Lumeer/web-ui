/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {ProjectDto} from '../../dto';
import {PermissionService} from '../common/permission.service';

export abstract class ProjectService extends PermissionService {
  abstract getProjects(organizationId: string): Observable<ProjectDto[]>;

  abstract getProjectCodes(organizationId: string): Observable<string[]>;

  abstract getProject(organizationId: string, projectId: string): Observable<ProjectDto>;

  abstract getProjectByCode(organizationId: string, projectCode: string): Observable<ProjectDto>;

  abstract deleteProject(organizationId: string, projectId: string): Observable<any>;

  abstract createProject(organizationId: string, project: ProjectDto): Observable<ProjectDto>;

  abstract applyTemplate(organizationId: string, projectId: string, template: string): Observable<any>;

  abstract updateProject(organizationId: string, projectId: string, project: ProjectDto): Observable<ProjectDto>;

}
