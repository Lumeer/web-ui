/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


import {PermissionDto, PermissionsDto, ViewDto} from '../../dto';
import {Observable} from 'rxjs';
import {Workspace} from '../../store/navigation/workspace';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';

export abstract class ViewService {
  abstract createView(view: ViewDto): Observable<ViewDto>;

  abstract updateView(id: string, view: ViewDto): Observable<ViewDto>;

  abstract getView(id: string): Observable<ViewDto>;

  abstract deleteView(id: string): Observable<string>;

  abstract getViews(workspace?: Workspace): Observable<ViewDto[]>;

  abstract addFavorite(id: string, workspace?: Workspace): Observable<any>;

  abstract removeFavorite(id: string, workspace?: Workspace): Observable<any>;

  abstract getPermissions(viewId: string): Observable<PermissionsDto>;

  abstract updateUserPermission(viewId: string, userPermissions: PermissionDto[]): Observable<PermissionDto>;

  abstract updateGroupPermission(viewId: string, userPermissions: PermissionDto[]): Observable<PermissionDto>;

  abstract removeUserPermission(viewId: string, user: string): Observable<any>;

  abstract removeGroupPermission(viewId: string, group: string): Observable<any>;

  abstract updateDefaultConfig(dto: DefaultViewConfigDto): Observable<DefaultViewConfigDto>;

  abstract getDefaultConfigs(workspace?: Workspace): Observable<DefaultViewConfigDto[]>;
}
