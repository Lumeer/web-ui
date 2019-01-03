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
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {Perspective, perspectivesMap} from '../../view/perspectives/perspective';
import {ViewComponent} from '../../view/view.component';
import {AppState} from '../store/app.state';
import {PostItAction} from '../store/postit/postit.action';
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
      this.clearPerspective(perspectivesMap[perspective]);
    }
    return true;
  }

  private clearPerspective(perspective: Perspective) {
    switch (perspective) {
      case Perspective.PostIt: {
        return this.store$.dispatch(new PostItAction.Clear());
      }
      // TODO maybe clear table config as well
      default:
        this.store$.dispatch(new ViewsAction.ChangeConfig({config: {}}));
    }
  }
}
