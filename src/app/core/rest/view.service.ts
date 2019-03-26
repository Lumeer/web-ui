/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ViewDto} from '../dto';
import {PermissionService} from './permission.service';
import {map} from 'rxjs/operators';
import {isNotNullOrUndefined} from '../../shared/utils/common.utils';
import {Workspace} from '../store/navigation/workspace';

@Injectable()
export class ViewService extends PermissionService {
  public createView(view: ViewDto): Observable<ViewDto> {
    return this.httpClient.post<ViewDto>(this.apiPrefix(), view);
  }

  public updateView(id: string, view: ViewDto): Observable<ViewDto> {
    return this.httpClient.put<ViewDto>(this.apiPrefix(id), view);
  }

  public getView(id: string): Observable<ViewDto> {
    return this.httpClient.get<ViewDto>(this.apiPrefix(id));
  }

  public deleteView(id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(id)).pipe(map(() => id));
  }

  public getViews(pageNumber?: number, pageSize?: number): Observable<ViewDto[]> {
    const queryParams = new HttpParams();

    if (isNotNullOrUndefined(pageNumber) && isNotNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString()).set('size', pageSize.toString());
    }

    return this.httpClient.get<ViewDto[]>(this.apiPrefix(), {params: queryParams});
  }

  protected actualApiPrefix(workspace?: Workspace): string {
    return this.apiPrefix(this.getOrCurrentViewId(workspace));
  }

  private apiPrefix(id?: string): string {
    const organizationId = this.getOrCurrentOrganizationId();
    const projectId = this.getOrCurrentProjectId();

    const viewsPath = `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}/views`;
    return id ? viewsPath.concat('/', id) : viewsPath;
  }
}
