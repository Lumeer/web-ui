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
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {first, map, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../../store/app.state';
import {ViewModel} from '../../store/views/view.model';
import {ViewsAction} from '../../store/views/views.action';
import {selectAllViews, selectViewsDictionary, selectViewsLoaded} from '../../store/views/views.state';

@Injectable()
export class ViewsGuard implements Resolve<ViewModel[]> {
  constructor(
    private i18n: I18n,
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ViewModel[]> {
    return this.store$.select(selectViewsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ViewsAction.Get());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => {
        const viewCode = route.paramMap.get('vc');
        if (!viewCode) {
          return this.store$.select(selectAllViews);
        }

        return this.store$.select(selectViewsDictionary).pipe(
          map(viewsMap => {
            const view = viewsMap[viewCode];
            if (view) {
              return [view];
            }

            const organizationCode = route.paramMap.get('organizationCode');
            const projectCode = route.paramMap.get('projectCode');
            this.onViewNotFound(organizationCode, projectCode);
            return [];
          })
        );
      }),
      first()
    );
  }

  private onViewNotFound(organizationCode: string, projectCode: string) {
    this.router.navigate(['w', organizationCode, projectCode, 'view', 'search', 'views']);
    const message = this.i18n({id: 'view.not.found', value: 'View not found'});
    this.notificationService.error(message);
  }
}
