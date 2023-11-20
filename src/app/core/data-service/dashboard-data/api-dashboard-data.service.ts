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
import {DashboardDataDto} from '../../dto/dashboard-data.dto';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {DashboardDataService} from './dashboard-data.service';

@Injectable()
export class ApiDashboardDataService extends BaseService implements DashboardDataService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public update(dto: DashboardDataDto): Observable<DashboardDataDto> {
    return this.httpClient.post<DashboardDataDto>(this.apiPrefix(), dto);
  }

  public getAll(workspace?: Workspace): Observable<DashboardDataDto[]> {
    return this.httpClient.get<DashboardDataDto[]>(this.apiPrefix(workspace));
  }

  public getOne(type: string, typeId: string, workspace?: Workspace): Observable<DashboardDataDto> {
    return this.httpClient.get<DashboardDataDto>(`${this.apiPrefix(workspace)}/${type}/${typeId}`);
  }

  public deleteByType(type: string, ids: string[]): Observable<DashboardDataDto> {
    return this.httpClient.post<DashboardDataDto>(`${this.apiPrefix()}/${type}/delete`, ids);
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/dashboard/data`;
  }
}
