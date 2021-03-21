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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {ResourceCommentService} from './resource-comment.service';
import {ResourceCommentDto} from '../../dto/resource-comment.dto';
import {ResourceType} from '../../model/resource-type';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiResourceCommentService extends BaseService implements ResourceCommentService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createComment(comment: ResourceCommentDto): Observable<ResourceCommentDto> {
    return this.httpClient.post<ResourceCommentDto>(this.apiPrefix({}, comment), comment);
  }

  public updateComment(comment: ResourceCommentDto): Observable<ResourceCommentDto> {
    return this.httpClient.put<ResourceCommentDto>(this.apiPrefix({}, comment), comment);
  }

  public removeComment(comment: ResourceCommentDto): Observable<any> {
    return this.httpClient.delete(`${this.apiPrefix({}, comment)}/${comment.id}`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  public getComments(
    resourceType: ResourceType,
    resourceId: string,
    pageStart?: number,
    pageLength?: number
  ): Observable<ResourceCommentDto[]> {
    const queryParams = new HttpParams()
      .set('pageStart', '' + (pageStart || 0))
      .set('pageLength', '' + (pageLength || 0));
    return this.httpClient.get<ResourceCommentDto[]>(this.apiPrefix({}, {resourceType, resourceId}), {
      params: queryParams,
    });
  }

  private apiPrefix(workspace: Workspace, comment: Partial<ResourceCommentDto>): string {
    return `${this.workspaceApiPrefix(workspace)}/comments/${comment.resourceType.toLowerCase()}/${comment.resourceId}`;
  }

  private workspaceApiPrefix(workspace: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
