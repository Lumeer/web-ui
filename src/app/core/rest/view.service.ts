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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import {PermissionService} from './permission.service';
import {View} from '../dto/view';
import {LocalStorage} from '../../shared/utils/local-storage';

@Injectable()
export class ViewService extends PermissionService {

  public createView(view: View): Observable<string> {
    const views = LocalStorage.get('views') || {};
    view.code = view.name.toLowerCase();
    views[view.code] = view;
    LocalStorage.set('views', views);
    return Observable.of(view.code);
  }

  public updateView(code: string, view: View): Observable<View> {
    const views = LocalStorage.get('views') || {};
    views[code] = null;
    views[view.code] = view;
    LocalStorage.set('views', views);
    return Observable.of(view);
  }

  public getView(code: string): Observable<View> {
    const views = LocalStorage.get('views') || {};
    return Observable.of(views[code]);
  }

  public getViews(): Observable<View[]> {
    const views = LocalStorage.get('views') || {};
    return Observable.of(Object.values(views));
  }

  protected actualApiPrefix(): string {
    let viewCode = this.workspace.viewCode;
    return `${this.apiPrefix()}/${viewCode}`;
  }

  private apiPrefix(): string {
    let organizationCode = this.workspace.organizationCode;
    let projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/views`;
  }
}
