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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {ViewComponent} from '../../view/view.component';
import {AppState} from '../store/app.state';
import {ViewsAction} from '../store/views/views.action';

@Injectable({
  providedIn: 'root',
})
export class ViewConfigCleanUpGuard implements CanDeactivate<ViewComponent> {
  constructor(private store$: Store<AppState>) {}

  public canDeactivate(
    component: ViewComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const [, viewCode] = nextState.url.match(/vc=([0-9a-z]*)/) || [null, null];
    const perspective =
      currentRoute.firstChild &&
      currentRoute.firstChild.url &&
      currentRoute.firstChild.url[0] &&
      currentRoute.firstChild.url[0].path;
    if (perspective && !nextState.url.includes(perspective) && !viewCode) {
      this.store$.dispatch(new ViewsAction.ChangeConfig({config: {}}));
    }
    this.store$.dispatch(new ViewsAction.ResetViewGlobalConfig());
    return true;
  }
}
