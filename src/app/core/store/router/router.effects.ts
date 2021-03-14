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

import {Location} from '@angular/common';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, mergeMap, tap} from 'rxjs/operators';
import {RouterAction, RouterActionType} from './router.action';
import {from} from 'rxjs';

@Injectable()
export class RouterEffects {
  public navigate$ = createEffect(() =>
    this.actions$.pipe(
      ofType<RouterAction.Go>(RouterActionType.GO),
      map(action => action.payload),
      mergeMap(({path, queryParams, extras, nextActions}) =>
        from(this.router.navigate(path, {queryParams, ...extras})).pipe(mergeMap(() => nextActions || []))
      )
    )
  );

  public navigateBack$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RouterActionType.BACK),
        tap(() => this.location.back())
      ),
    {dispatch: false}
  );

  public navigateForward$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RouterActionType.FORWARD),
        tap(() => this.location.forward())
      ),
    {dispatch: false}
  );

  constructor(private actions$: Actions, private router: Router, private location: Location) {}
}
