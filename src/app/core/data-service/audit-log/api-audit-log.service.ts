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

import {Injectable} from '@angular/core';
import {AuditLogService} from './audit-log.service';
import {Observable, of} from 'rxjs';
import {AuditLogDto} from '../../dto/audit-log.dto';
import {HttpClient} from '@angular/common/http';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {Workspace} from '../../store/navigation/workspace';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Store} from '@ngrx/store';
import {DocumentDto, LinkInstanceDto} from '../../dto';

@Injectable()
export class ApiAuditLogService extends BaseService implements AuditLogService {
  constructor(
    protected store$: Store<AppState>,
    private httpClient: HttpClient,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public getByDocument(collectionId: string, documentId: string, workspace?: Workspace): Observable<AuditLogDto[]> {
    return this.httpClient.get<AuditLogDto[]>(this.collectionApiPrefix(documentId, {...workspace, collectionId}), {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public getByLink(linkTypeId: string, linkInstanceId: string, workspace?: Workspace): Observable<AuditLogDto[]> {
    return this.httpClient.get<AuditLogDto[]>(this.linkTypeApiPrefix(linkTypeId, linkInstanceId, workspace), {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public getByCollection(collectionId: string, workspace?: Workspace): Observable<AuditLogDto[]> {
    const api = `${this.workspaceApiPrefix({...workspace, collectionId})}/collections/${collectionId}/audit`;
    return this.get(api, workspace);
  }

  public getByLinkType(linkTypeId: string, workspace?: Workspace): Observable<AuditLogDto[]> {
    const api = `${this.workspaceApiPrefix(workspace)}/link-types/${linkTypeId}/audit`;
    return this.get(api, workspace);
  }

  public getByProject(workspace?: Workspace): Observable<AuditLogDto[]> {
    const api = `${this.workspaceApiPrefix(workspace)}/audit`;
    return this.get(api, workspace);
  }

  private get(api: string, workspace?: Workspace): Observable<AuditLogDto[]> {
    return this.httpClient.get<AuditLogDto[]>(api, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public revertDocument(
    collectionId: string,
    documentId: string,
    auditLogId: string,
    workspace?: Workspace
  ): Observable<DocumentDto> {
    return this.httpClient.post<DocumentDto>(
      `${this.collectionApiPrefix(documentId, {...workspace, collectionId})}/${auditLogId}/revert`,
      {},
      {
        headers: {...this.workspaceHeaders(workspace)},
      }
    );
  }

  public revertLink(
    linkTypeId: string,
    linkInstanceId: string,
    auditLogId: string,
    workspace?: Workspace
  ): Observable<LinkInstanceDto> {
    return this.httpClient.post<LinkInstanceDto>(
      `${this.linkTypeApiPrefix(linkTypeId, linkInstanceId, workspace)}/${auditLogId}/revert`,
      {},
      {
        headers: {...this.workspaceHeaders(workspace)},
      }
    );
  }

  private linkTypeApiPrefix(linkTypeId: string, linkInstanceId: string, workspace?: Workspace): string {
    return `${this.workspaceApiPrefix(workspace)}/link-instances/${linkTypeId}/${linkInstanceId}/audit`;
  }

  private collectionApiPrefix(documentId: string, workspace?: Workspace): string {
    const collectionId = this.getOrCurrentCollectionId(workspace);

    return `${this.workspaceApiPrefix(workspace)}/collections/${collectionId}/documents/${documentId}/audit`;
  }

  private workspaceApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
