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

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {LinkInstanceService} from './link-instance.service';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {LinkInstanceDto} from '../../dto';
import {LinkInstanceDuplicateDto} from '../../dto/link-instance.dto';
import {Workspace} from '../../store/navigation/workspace';
import {DocumentLinksDto} from '../../dto/document-links.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiLinkInstanceService extends BaseService implements LinkInstanceService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public getLinkInstance(
    linkTypeId: string,
    linkInstanceId: string,
    workspace?: Workspace
  ): Observable<LinkInstanceDto> {
    return this.httpClient.get<LinkInstanceDto>(this.apiPrefix(workspace, linkTypeId, linkInstanceId), {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public getLinkInstances(linkInstanceIds: string[], workspace?: Workspace): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.workspaceApiPrefix()}/data/linkInstances`, linkInstanceIds, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public updateLinkInstance(linkInstance: LinkInstanceDto, workspace?: Workspace): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(this.apiPrefix(workspace, linkInstance.id), linkInstance, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public createLinkInstance(linkInstance: LinkInstanceDto, workspace?: Workspace): Observable<LinkInstanceDto> {
    return this.httpClient.post<LinkInstanceDto>(this.apiPrefix(workspace), linkInstance, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public patchLinkInstanceData(
    linkInstanceId: string,
    data: Record<string, any>,
    workspace?: Workspace
  ): Observable<LinkInstanceDto> {
    return this.httpClient.patch<LinkInstanceDto>(`${this.apiPrefix(workspace, linkInstanceId)}/data`, data, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public updateLinkInstanceData(linkInstanceDto: LinkInstanceDto, workspace?: Workspace): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(
      `${this.apiPrefix(workspace, linkInstanceDto.id)}/data`,
      linkInstanceDto.data,
      {
        headers: {...this.workspaceHeaders(workspace)},
      }
    );
  }

  public deleteLinkInstance(id: string, workspace?: Workspace): Observable<string> {
    return this.httpClient
      .delete(this.apiPrefix(workspace, id), {
        headers: {...this.workspaceHeaders(workspace)},
      })
      .pipe(map(() => id));
  }

  public duplicateLinkInstances(
    linkInstanceDuplicate: LinkInstanceDuplicateDto,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.apiPrefix(workspace)}/duplicate`, linkInstanceDuplicate, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public runRule(
    linkTypeId: string,
    linkInstanceId: string,
    attributeId: string,
    actionName?: string,
    workspace?: Workspace
  ): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiPrefix(workspace, linkTypeId, linkInstanceId)}/rule/${attributeId}?actionName=${actionName || ''}`,
      {},
      {
        headers: {...this.workspaceHeaders(workspace)},
      }
    );
  }

  public setDocumentLinks(
    linkTypeId: string,
    dto: DocumentLinksDto,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.apiPrefix(workspace, linkTypeId)}/documentLinks`, dto, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  private apiPrefix(workspace?: Workspace, linkTypeId?: string, linkInstanceId?: string): string {
    const suffix = (linkTypeId ? `/${linkTypeId}` : '') + (linkInstanceId ? `/${linkInstanceId}` : '');

    return `${this.workspaceApiPrefix(workspace)}/link-instances${suffix}`;
  }

  private workspaceApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
