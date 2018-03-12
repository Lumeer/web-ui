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

import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, Effect} from '@ngrx/effects';
import {map, tap} from 'rxjs/operators';
import {RouterAction, RouterActionType} from './router.action';

@Injectable()
export class RouterEffects {

  @Effect({dispatch: false})
  public navigate$ = this.actions$.ofType(RouterActionType.GO).pipe(
    map((action: RouterAction.Go) => action.payload),
    tap(({path, query: queryParams, extras}) => this.router.navigate(path, {queryParams, ...extras}))
  );

  @Effect({dispatch: false})
  public navigateBack$ = this.actions$.ofType(RouterActionType.BACK).pipe(
    tap(() => this.location.back())
  );

  @Effect({dispatch: false})
  public navigateForward$ = this.actions$.ofType(RouterActionType.FORWARD).pipe(
    tap(() => this.location.forward())
  );

  constructor(private actions$: Actions,
              private router: Router,
              private location: Location) {
  }
}
