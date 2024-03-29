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
import {Observable} from 'rxjs';

import {PermissionsDto, ViewDto} from '../../dto';
import {DefaultViewConfigDto} from '../../dto/default-view-config.dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class ViewService {
  public abstract createView(view: ViewDto): Observable<ViewDto>;

  public abstract updateView(id: string, view: ViewDto): Observable<ViewDto>;

  public abstract getView(id: string): Observable<ViewDto>;

  public abstract deleteView(id: string): Observable<string>;

  public abstract getViews(workspace?: Workspace): Observable<ViewDto[]>;

  public abstract addFavorite(id: string, workspace?: Workspace): Observable<any>;

  public abstract removeFavorite(id: string, workspace?: Workspace): Observable<any>;

  public abstract getPermissions(viewId: string): Observable<PermissionsDto>;

  public abstract updatePermissions(viewId: string, permissions: PermissionsDto): Observable<PermissionsDto>;

  public abstract updateDefaultConfig(dto: DefaultViewConfigDto): Observable<DefaultViewConfigDto>;

  public abstract getDefaultConfigs(workspace?: Workspace): Observable<DefaultViewConfigDto[]>;
}
