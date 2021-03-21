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
import {GroupDto} from '../dto';
import {AppState} from '../store/app.state';
import {map} from 'rxjs/operators';
import {BaseService} from './base.service';
import {ConfigurationService} from '../../configuration/configuration.service';

@Injectable()
export class GroupService extends BaseService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createGroup(group: GroupDto): Observable<GroupDto> {
    return this.httpClient.post<GroupDto>(this.apiPrefix(), group);
  }

  public updateGroup(id: string, group: GroupDto): Observable<GroupDto> {
    return this.httpClient.put<GroupDto>(this.apiPrefix(id), group);
  }

  public deleteGroup(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id), {observe: 'response', responseType: 'text'}).pipe(map(() => id));
  }

  public getGroups(): Observable<GroupDto[]> {
    return this.httpClient.get<GroupDto[]>(this.apiPrefix());
  }

  private apiPrefix(groupId?: string): string {
    const organizationId = this.getOrCurrentOrganizationId();
    return `${this.configurationService.getConfiguration().apiUrl}/rest/organizations/${organizationId}/groups${
      groupId ? `/${groupId}` : ''
    }`;
  }
}
