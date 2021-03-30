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
import {AppIdService} from '../../service/app-id.service';
import {DocumentLinksDto} from '../../dto/document-links.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {correlationIdHeader} from '../../rest/interceptors/correlation-id.http-interceptor';

@Injectable()
export class ApiLinkInstanceService extends BaseService implements LinkInstanceService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private appId: AppIdService,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public getLinkInstance(linkTypeId: string, linkInstanceId: string): Observable<LinkInstanceDto> {
    return this.httpClient.get<LinkInstanceDto>(this.apiPrefix(linkTypeId, linkInstanceId));
  }

  public getLinkInstances(linkInstanceIds: string[]): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.workspaceApiPrefix()}/data/linkInstances`, linkInstanceIds);
  }

  public updateLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(this.apiPrefix(linkInstance.id), linkInstance);
  }

  public createLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.post<LinkInstanceDto>(this.apiPrefix(), linkInstance);
  }

  public patchLinkInstanceData(linkInstanceId: string, data: Record<string, any>): Observable<LinkInstanceDto> {
    return this.httpClient.patch<LinkInstanceDto>(`${this.apiPrefix(linkInstanceId)}/data`, data, {
      headers: {
        [correlationIdHeader]: this.appId.getAppId(),
      },
    });
  }

  public updateLinkInstanceData(linkInstanceDto: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(`${this.apiPrefix(linkInstanceDto.id)}/data`, linkInstanceDto.data, {
      headers: {
        [correlationIdHeader]: this.appId.getAppId(),
      },
    });
  }

  public deleteLinkInstance(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id)).pipe(map(() => id));
  }

  public duplicateLinkInstances(linkInstanceDuplicate: LinkInstanceDuplicateDto): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.apiPrefix()}/duplicate`, linkInstanceDuplicate);
  }

  public runRule(
    linkTypeId: string,
    linkInstanceId: string,
    attributeId: string,
    actionName?: string
  ): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiPrefix(linkTypeId, linkInstanceId)}/rule/${attributeId}?actionName=${actionName || ''}`,
      {
        correlationId: this.appId.getAppId(),
      }
    );
  }

  public setDocumentLinks(linkTypeId: string, dto: DocumentLinksDto): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.apiPrefix(linkTypeId)}/documentLinks`, dto);
  }

  private apiPrefix(linkTypeId?: string, linkInstanceId?: string): string {
    const suffix = (linkTypeId ? `/${linkTypeId}` : '') + (linkInstanceId ? `/${linkInstanceId}` : '');

    return `${this.workspaceApiPrefix()}/link-instances${suffix}`;
  }

  private workspaceApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
