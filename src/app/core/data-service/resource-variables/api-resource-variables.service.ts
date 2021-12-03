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

import {BaseService} from '../../rest/base.service';
import {ResourceVariablesService} from './resource-variables.service';
import {SelectionListDto} from '../../dto/selection-list.dto';
import {Observable, of} from 'rxjs';
import {Workspace} from '../../store/navigation/workspace';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {ResourceVariableDto} from '../../dto/resource-variable.dto';
import {generateId} from '../../../shared/utils/resource.utils';

@Injectable()
export class ApiResourceVariablesService extends BaseService implements ResourceVariablesService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public create(dto: ResourceVariableDto): Observable<ResourceVariableDto> {
    return of({...dto, id: generateId()});
  }

  public delete(id: string): Observable<string> {
    return of(id);
  }

  public get(organizationId: string, projectId: string): Observable<ResourceVariableDto[]> {
    return of([]);
  }

  public update(id: string, dto: ResourceVariableDto): Observable<ResourceVariableDto> {
    return of(dto);
  }

  public getOne(id: string): Observable<SelectionListDto> {
    return of(null);
  }

  private apiPrefix(workspace?: Workspace, listId?: string): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    return `${this.configurationService.getConfiguration().apiUrl}/rest/organizations/${organizationId}/variables${
      listId ? `/${listId}` : ''
    }`;
  }

  private projectApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/variables/projects/${projectId}`;
  }
}
