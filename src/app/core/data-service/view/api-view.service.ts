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
import {PermissionsDto, ViewDto} from '../../dto';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {ViewService} from './view.service';

@Injectable()
export class ApiViewService extends BaseService implements ViewService {
  constructor(
    private http: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createView(view: ViewDto): Observable<ViewDto> {
    return this.http.post<ViewDto>(this.apiPrefix(), view);
  }

  public updateView(id: string, view: ViewDto): Observable<ViewDto> {
    return this.http.put<ViewDto>(this.apiPrefix(id), view);
  }

  public getView(id: string): Observable<ViewDto> {
    return this.http.get<ViewDto>(this.apiPrefix(id));
  }

  public deleteView(id: string): Observable<string> {
    return this.http.delete(this.apiPrefix(id)).pipe(map(() => id));
  }

  public getViews(workspace?: Workspace): Observable<ViewDto[]> {
    return this.http.get<ViewDto[]>(this.apiPrefix(null, workspace));
  }

  public addFavorite(id: string, workspace?: Workspace): Observable<any> {
    return this.http.post(`${this.apiPrefix(id, workspace)}/favorite`, {});
  }

  public removeFavorite(id: string, workspace?: Workspace): Observable<any> {
    return this.http.delete(`${this.apiPrefix(id, workspace)}/favorite`);
  }

  public getPermissions(viewId: string): Observable<PermissionsDto> {
    return this.http.get<PermissionsDto>(`${this.apiPrefix(viewId)}/permissions`);
  }

  public updatePermissions(viewId: string, permissions: PermissionsDto): Observable<PermissionsDto> {
    return this.http.put<PermissionsDto>(`${this.apiPrefix(viewId)}/permissions`, permissions);
  }

  public updateDefaultConfig(dto: DefaultViewConfigDto): Observable<DefaultViewConfigDto> {
    return this.http.put<DefaultViewConfigDto>(`${this.apiPrefix()}/defaultConfigs/config`, dto);
  }

  public getDefaultConfigs(workspace?: Workspace): Observable<DefaultViewConfigDto[]> {
    return this.http.get<DefaultViewConfigDto[]>(`${this.apiPrefix(null, workspace)}/defaultConfigs/all`);
  }

  private apiPrefix(id?: string, workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace || this.workspace);
    const projectId = this.getOrCurrentProjectId(workspace || this.workspace);

    const viewsPath = `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/views`;
    return id ? viewsPath.concat('/', id) : viewsPath;
  }
}
