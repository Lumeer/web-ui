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

import {ConfigurationService} from '../../../configuration/configuration.service';
import {AttributeDto, LinkTypeDto} from '../../dto';
import {RuleDto} from '../../dto/rule.dto';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {LinkTypeService} from './link-type.service';

@Injectable()
export class ApiLinkTypeService extends BaseService implements LinkTypeService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createLinkType(linkType: LinkTypeDto, workspace?: Workspace): Observable<LinkTypeDto> {
    return this.httpClient.post<LinkTypeDto>(this.restApiPrefix(null, workspace), linkType, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public getLinkType(id: string, workspace?: Workspace): Observable<LinkTypeDto> {
    return this.httpClient.get<LinkTypeDto>(this.restApiPrefix(id, workspace));
  }

  public updateLinkType(id: string, linkType: LinkTypeDto, workspace?: Workspace): Observable<LinkTypeDto> {
    return this.httpClient.put<LinkTypeDto>(this.restApiPrefix(id, workspace), linkType, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public upsertRule(
    linkTypeId: string,
    ruleId: string,
    ruleDto: RuleDto,
    workspace?: Workspace
  ): Observable<LinkTypeDto> {
    return this.httpClient.put<LinkTypeDto>(`${this.restApiPrefix(linkTypeId, workspace)}/rule/${ruleId}`, ruleDto, {
      headers: {...this.workspaceHeaders(workspace)},
    });
  }

  public deleteLinkType(id: string): Observable<string> {
    return this.httpClient.delete(this.restApiPrefix(id)).pipe(map(() => id));
  }

  public getLinkTypes(workspace?: Workspace): Observable<LinkTypeDto[]> {
    return this.httpClient.get<LinkTypeDto[]>(this.restApiPrefix(null, workspace));
  }

  public createAttributes(linkTypeId: string, attributes: AttributeDto[]): Observable<AttributeDto[]> {
    return this.httpClient.post<AttributeDto[]>(`${this.restApiPrefix()}/${linkTypeId}/attributes`, attributes);
  }

  public updateAttribute(
    linkTypeId: string,
    id: string,
    attribute: AttributeDto,
    workspace?: Workspace
  ): Observable<AttributeDto> {
    return this.httpClient.put<AttributeDto>(
      `${this.restApiPrefix(null, workspace)}/${linkTypeId}/attributes/${id}`,
      attribute,
      {
        headers: {...this.workspaceHeaders(workspace)},
      }
    );
  }

  public deleteAttribute(linkTypeId: string, id: string): Observable<any> {
    return this.httpClient.delete(`${this.restApiPrefix()}/${linkTypeId}/attributes/${id}`);
  }

  private restApiPrefix(id?: string, workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    const suffix = id ? `/${id}` : '';

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/link-types${suffix}`;
  }
}
