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
import {TeamService} from './team.service';
import {Workspace} from '../../store/navigation/workspace';
import {TeamDto} from '../../dto';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {AppState} from '../../store/app.state';
import {BaseService} from '../../rest/base.service';

@Injectable()
export class ApiTeamService extends BaseService implements TeamService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public create(team: TeamDto): Observable<TeamDto> {
    return this.httpClient.post<TeamDto>(this.apiPrefix(), team);
  }

  public update(id: string, team: TeamDto): Observable<TeamDto> {
    return this.httpClient.put<TeamDto>(this.apiPrefix(id), team);
  }

  public delete(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id), {observe: 'response', responseType: 'text'}).pipe(map(() => id));
  }

  public getAll(organizationId: string): Observable<TeamDto[]> {
    return this.httpClient.get<TeamDto[]>(this.apiPrefix(null, {organizationId}));
  }

  private apiPrefix(groupId?: string, workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    return `${this.configurationService.getConfiguration().apiUrl}/rest/organizations/${organizationId}/groups${
      groupId ? `/${groupId}` : ''
    }`;
  }
}
