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
import {Observable, of} from 'rxjs';
import {ViewService} from './view.service';
import {PermissionDto, PermissionsDto, ViewDto} from '../../dto';
import {AppState} from '../../store/app.state';
import {BaseService} from '../../rest/base.service';
import {Workspace} from '../../store/navigation/workspace';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';
import {environment} from '../../../../environments/environment';
import {generateId} from '../../../shared/utils/resource.utils';

@Injectable()
export class MockViewService extends BaseService implements ViewService {
  constructor(private http: HttpClient, protected store$: Store<AppState>) {
    super(store$);
  }

  public createView(view: ViewDto): Observable<ViewDto> {
    return of({...view, id: generateId()});
  }

  public updateView(id: string, view: ViewDto): Observable<ViewDto> {
    return of(view);
  }

  public getView(id: string): Observable<ViewDto> {
    return of(null);
  }

  public deleteView(id: string): Observable<string> {
    return of(id);
  }

  public getViews(workspace?: Workspace): Observable<ViewDto[]> {
    return this.http.get<ViewDto[]>(this.apiPrefix(null, workspace));
  }

  public addFavorite(id: string, workspace?: Workspace): Observable<any> {
    return of(true);
  }

  public removeFavorite(id: string, workspace?: Workspace): Observable<any> {
    return of(true);
  }

  public getPermissions(viewId: string): Observable<PermissionsDto> {
    return of({users: [], groups: []});
  }

  public updateUserPermission(viewId: string, userPermissions: PermissionDto[]): Observable<PermissionDto> {
    return of({id: '', roles: []});
  }

  public updateGroupPermission(viewId: string, userPermissions: PermissionDto[]): Observable<PermissionDto> {
    return of({id: '', roles: []});
  }

  public removeUserPermission(viewId: string, user: string): Observable<any> {
    return of(true);
  }

  public removeGroupPermission(viewId: string, group: string): Observable<any> {
    return of(true);
  }

  public updateDefaultConfig(dto: DefaultViewConfigDto): Observable<DefaultViewConfigDto> {
    return of(dto);
  }

  public getDefaultConfigs(workspace?: Workspace): Observable<DefaultViewConfigDto[]> {
    return of([]);
  }

  private apiPrefix(id?: string, workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace || this.workspace);
    const projectId = this.getOrCurrentProjectId(workspace || this.workspace);

    const viewsPath = `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}/views`;
    return id ? viewsPath.concat('/', id) : viewsPath;
  }
}
