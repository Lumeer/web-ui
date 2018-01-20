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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {map, skipWhile, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../core/store/app.state';
import {selectNavigation} from '../core/store/navigation/navigation.state';
import {ViewsAction} from '../core/store/views/views.action';
import {selectViewsDictionary} from '../core/store/views/views.state';
import {QueryConverter} from '../core/store/navigation/query.converter';
import {Perspective} from './perspectives/perspective';

@Injectable()
export class ViewGuard implements CanActivate {

  public constructor(private router: Router,
                     private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {
    const viewCode = next.paramMap.get('vc');

    this.store.dispatch(new ViewsAction.GetByCode({viewCode: viewCode}));

    return this.store.select(selectViewsDictionary).pipe(
      withLatestFrom(this.store.select(selectNavigation)),
      skipWhile(([views]) => !(viewCode in views)),
      tap(([views, navigation]) => {
        const workspace = navigation.workspace;
        const view = views[workspace.viewCode];
        const perspective = view && view.perspective ? view.perspective : Perspective.Search;
        const query = view ? QueryConverter.toString(view.query) : null;

        const viewPath: any[] = ['w', workspace.organizationCode, workspace.projectCode, 'view'];
        if (viewCode) {
          viewPath.push({vc: viewCode});
        }
        viewPath.push(perspective);

        this.router.navigate(viewPath, {queryParams: {query: query}});
      }),
      map(a => true)
    );
  }

}
