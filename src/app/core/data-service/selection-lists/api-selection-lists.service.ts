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

import {ConfigurationService} from '../../../configuration/configuration.service';
import {SelectionListDto} from '../../dto/selection-list.dto';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {SelectionListsService} from './selection-lists.service';

@Injectable()
export class ApiSelectionListsService extends BaseService implements SelectionListsService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public create(organizationId: string, dto: SelectionListDto): Observable<SelectionListDto> {
    return this.httpClient.post<SelectionListDto>(this.apiPrefix({organizationId}), dto);
  }

  public createSampleLists(organizationId: string, projectId: string): Observable<any> {
    return this.httpClient.post(`${this.projectApiPrefix({organizationId, projectId})}/sample`, {});
  }

  public delete(organizationId: string, id: string): Observable<any> {
    return this.httpClient.delete(this.apiPrefix({organizationId}, id));
  }

  public getOne(organizationId: string, id: string): Observable<SelectionListDto> {
    return this.httpClient.get<SelectionListDto>(this.apiPrefix({organizationId}, id));
  }

  public get(organizationId: string): Observable<SelectionListDto[]> {
    return this.httpClient.get<SelectionListDto[]>(this.apiPrefix({organizationId}));
  }

  public getByProject(organizationId: string, projectId: string): Observable<SelectionListDto[]> {
    return this.httpClient.get<SelectionListDto[]>(this.projectApiPrefix({organizationId, projectId}));
  }

  public update(organizationId: string, id: string, dto: SelectionListDto): Observable<SelectionListDto> {
    return this.httpClient.put<SelectionListDto>(this.apiPrefix({organizationId}, id), dto);
  }

  private apiPrefix(workspace?: Workspace, listId?: string): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/selection-lists${listId ? `/${listId}` : ''}`;
  }

  private projectApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/selection-lists/projects/${projectId}`;
  }
}
