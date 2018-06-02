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

import {of, Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {map, skipWhile, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {Perspective} from '../../../view/perspectives/perspective';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../../store/app.state';
import {selectNavigation} from '../../store/navigation/navigation.state';
import {QueryConverter} from '../../store/navigation/query.converter';
import {Workspace} from '../../store/navigation/workspace.model';
import {ViewModel} from '../../store/views/view.model';
import {selectViewByCode, selectViewsLoaded} from '../../store/views/views.state';

@Injectable()
export class ViewExistGuard implements CanActivate {

  public constructor(private i18n: I18n,
                     private notificationsService: NotificationService,
                     private router: Router,
                     private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {
    const viewCode = next.paramMap.get('vc');
    if (!viewCode) {
      return of(true);
    }

    return this.store.select(selectViewsLoaded).pipe(
      skipWhile((loaded) => !loaded),
      switchMap(() => this.store.select(selectViewByCode(viewCode))),
      take(1),
      withLatestFrom(this.store.select(selectNavigation)),
      map(([view, navigation]) => {
        const workspace = navigation.workspace;
        if (!view) {
          return this.onViewNotFound(workspace);
        }

        if (!navigation.perspective || !next.queryParamMap.get('query')) {
          return this.redirectToCorrectPath(view, workspace);
        }

        return true;
      })
    );
  }

  private onViewNotFound(workspace: Workspace): boolean {
    this.router.navigate(['w', workspace.organizationCode, workspace.projectCode, 'view', 'search', 'views']);
    const message = this.i18n({id: 'view.not.found', value: 'View not found'});
    this.notificationsService.error(message);
    return false;
  }

  private redirectToCorrectPath(view: ViewModel, workspace: Workspace) {
    const perspective = view.perspective ? view.perspective : Perspective.Search;
    const query = QueryConverter.toString(view.query);
    this.router.navigate(['w', workspace.organizationCode, workspace.projectCode, 'view', {vc: view.code}, perspective,], {queryParams: {query}});
    return false;
  }

}
