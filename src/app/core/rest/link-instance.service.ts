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
import {environment} from '../../../environments/environment';
import {LinkInstanceDto} from '../dto';
import {LinkInstanceDuplicateDto} from '../dto/link-instance.dto';
import {AppState} from '../store/app.state';
import {BaseService} from './base.service';

@Injectable()
export class LinkInstanceService extends BaseService {
  constructor(private httpClient: HttpClient, protected store$: Store<AppState>) {
    super(store$);
  }

  public getLinkInstance(linkTypeId: string, linkInstanceId: string): Observable<LinkInstanceDto> {
    return this.httpClient.get<LinkInstanceDto>(this.restApiPrefix(linkTypeId, linkInstanceId));
  }

  public updateLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.put<LinkInstanceDto>(this.restApiPrefix(linkInstance.id), linkInstance);
  }

  public createLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.httpClient.post<LinkInstanceDto>(this.restApiPrefix(), linkInstance);
  }

  public patchLinkInstanceData(linkInstanceId: string, data: Record<string, any>): Observable<LinkInstanceDto> {
    return this.httpClient.patch<LinkInstanceDto>(`${this.restApiPrefix(linkInstanceId)}/data`, data);
  }

  public deleteLinkInstance(id: string): Observable<string> {
    return this.httpClient.delete(this.restApiPrefix(id)).pipe(map(() => id));
  }

  public duplicateLinkInstances(linkInstanceDuplicate: LinkInstanceDuplicateDto): Observable<LinkInstanceDto[]> {
    return this.httpClient.post<LinkInstanceDto[]>(`${this.restApiPrefix()}/duplicate`, linkInstanceDuplicate);
  }

  private restApiPrefix(id?: string, secondId?: string): string {
    const organizationId = this.getOrCurrentOrganizationId();
    const projectId = this.getOrCurrentProjectId();
    const suffix = (id ? `/${id}` : '') + (secondId ? `/${secondId}` : '');

    return `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}/link-instances${suffix}`;
  }
}
