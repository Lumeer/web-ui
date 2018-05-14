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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {first, map, mergeMap, skipWhile, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {RouterAction} from '../router/router.action';
import {NavigationAction, NavigationActionType} from './navigation.action';
import {selectQuery} from './navigation.state';
import {QueryConverter} from './query.converter';

@Injectable()
export class NavigationEffects {

  @Effect()
  public addLinkToQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.AddLinkToQuery>(NavigationActionType.ADD_LINK_TO_QUERY),
    mergeMap(action => this.store$.select(selectQuery).pipe(
      skipWhile(query => !query),
      first(),
      map(query => ({action, query}))
    )),
    map(({action, query}) => {
      const linkTypeIds = (query.linkTypeIds || []).concat(action.payload.linkTypeId);

      return new RouterAction.Go({
        path: [],
        queryParams: {
          query: QueryConverter.toString({...query, linkTypeIds})
        },
        extras: {
          queryParamsHandling: 'merge'
        }
      });
    })
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>) {
  }

}
