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
import {environment} from '../../../../environments/environment';

@Injectable()
export class ApiLinkInstanceService extends BaseService implements LinkInstanceService {
  constructor(private httpClient: HttpClient, protected store$: Store<AppState>) {
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
    return this.httpClient.patch<LinkInstanceDto>(`${this.apiPrefix(linkInstanceId)}/data`, data);
  }

  public updateLinkInstanceData(linkInstanceDto: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(`${this.apiPrefix(linkInstanceDto.id)}/data`, linkInstanceDto.data);
  }

  public deleteLinkInstance(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id)).pipe(map(() => id));
  }

  public duplicateLinkInstances(linkInstanceDuplicate: LinkInstanceDuplicateDto): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.apiPrefix()}/duplicate`, linkInstanceDuplicate);
  }

  private apiPrefix(linkTypeId?: string, linkInstanceId?: string): string {
    const suffix = (linkTypeId ? `/${linkTypeId}` : '') + (linkInstanceId ? `/${linkInstanceId}` : '');

    return `${this.workspaceApiPrefix()}/link-instances${suffix}`;
  }

  private workspaceApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
