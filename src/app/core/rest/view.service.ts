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
import {isNullOrUndefined} from 'util';
import {environment} from '../../../environments/environment';
import {View} from '../dto';
import {PermissionService} from './permission.service';
import {map} from 'rxjs/operators';

@Injectable()
export class ViewService extends PermissionService {
  public createView(view: View): Observable<View> {
    return this.httpClient.post<View>(this.apiPrefix(), view);
  }

  public updateView(code: string, view: View): Observable<View> {
    return this.httpClient.put<View>(this.apiPrefix(code), view);
  }

  public getView(code: string): Observable<View> {
    return this.httpClient.get<View>(this.apiPrefix(code));
  }

  public deleteView(code: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(code)).pipe(map(() => code));
  }

  public getViews(pageNumber?: number, pageSize?: number): Observable<View[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString()).set('size', pageSize.toString());
    }

    return this.httpClient.get<View[]>(this.apiPrefix(), {params: queryParams});
  }

  protected actualApiPrefix(): string {
    const viewCode = this.workspace.viewCode;
    return this.apiPrefix(viewCode);
  }

  private apiPrefix(code?: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    const viewsPath = `${environment.apiUrl}/rest/organizations/${organizationCode}/projects/${projectCode}/views`;
    return code ? viewsPath.concat('/', code) : viewsPath;
  }
}
