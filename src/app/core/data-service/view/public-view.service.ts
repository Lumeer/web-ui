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

import {Store, select} from '@ngrx/store';

import {Observable, of} from 'rxjs';
import {map, mergeMap, take} from 'rxjs/operators';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {generateId} from '../../../shared/utils/resource.utils';
import {DEFAULT_USER} from '../../constants';
import {PermissionsDto, ViewDto} from '../../dto';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';
import {RoleType} from '../../model/role-type';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {Workspace} from '../../store/navigation/workspace';
import {selectPublicProject} from '../../store/projects/projects.state';
import {viewRoleTypes} from '../../store/views/view';
import {convertViewModelToDto} from '../../store/views/view.converter';
import {selectViewByCode} from '../../store/views/views.state';
import {setDefaultUserPermissions} from '../common/public-api-util';
import {ViewService} from './view.service';

@Injectable()
export class PublicViewService extends BaseService implements ViewService {
  constructor(
    private http: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createView(view: ViewDto): Observable<ViewDto> {
    return this.isProjectWritable$().pipe(
      map(writable => setViewPermission({...view, id: generateId(), code: generateId(), version: 0}, writable))
    );
  }

  public updateView(id: string, dto: ViewDto): Observable<ViewDto> {
    return this.store$.pipe(
      select(selectViewByCode(dto.code)),
      map(view => ({...convertViewModelToDto(view), ...dto})),
      map(view => ({...view, version: (view.version || 0) + 1})),
      take(1),
      mergeMap(view => this.isProjectWritable$().pipe(map(editable => setViewPermission(view, editable))))
    );
  }

  public getView(id: string): Observable<ViewDto> {
    return of(null);
  }

  public deleteView(id: string): Observable<string> {
    return of(id);
  }

  public getViews(workspace?: Workspace): Observable<ViewDto[]> {
    return this.http
      .get<ViewDto[]>(this.apiPrefix(workspace))
      .pipe(
        mergeMap(views =>
          this.isProjectWritable$().pipe(map(editable => views.map(view => setViewPermission(view, editable))))
        )
      );
  }

  private isProjectWritable$(): Observable<boolean> {
    return this.store$.pipe(
      select(selectPublicProject),
      map(project => project?.templateMetadata?.editable),
      take(1)
    );
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

  public updatePermissions(viewId: string, permissions: PermissionsDto): Observable<PermissionsDto> {
    return of(permissions);
  }

  public updateDefaultConfig(dto: DefaultViewConfigDto): Observable<DefaultViewConfigDto> {
    return of(dto);
  }

  public getDefaultConfigs(workspace?: Workspace): Observable<DefaultViewConfigDto[]> {
    return of([]);
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace || this.workspace);
    const projectId = this.getOrCurrentProjectId(workspace || this.workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/p/organizations/${organizationId}/projects/${projectId}/views`;
  }
}

function setViewPermission(dto: ViewDto, editable?: boolean): ViewDto {
  return setDefaultUserPermissions(dto, DEFAULT_USER, editable ? viewRoleTypes : [RoleType.Read]);
}
