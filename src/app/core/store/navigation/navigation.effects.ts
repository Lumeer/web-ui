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
import {NavigationExtras, Router} from '@angular/router';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map, mergeMap, skipWhile, take, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {RouterAction} from '../router/router.action';
import {NavigationAction, NavigationActionType} from './navigation.action';
import {selectNavigation, selectQuery} from './navigation.state';
import {QueryConverter} from './query.converter';
import {QueryModel} from './query.model';
import {SearchTab} from './search-tab';
import {Perspective} from '../../../view/perspectives/perspective';

@Injectable()
export class NavigationEffects {
  @Effect()
  public addLinkToQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.AddLinkToQuery>(NavigationActionType.ADD_LINK_TO_QUERY),
    mergeMap(action =>
      this.store$.select(selectQuery).pipe(
        skipWhile(query => !query),
        take(1),
        map(query => ({action, query}))
      )
    ),
    map(({action, query}) => {
      const linkTypeIds = (query.linkTypeIds || []).concat(action.payload.linkTypeId);

      return newQueryAction({...query, linkTypeIds});
    })
  );

  @Effect()
  public addCollectionToQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.AddCollectionToQuery>(NavigationActionType.ADD_COLLECTION_TO_QUERY),
    mergeMap(action =>
      this.store$.select(selectQuery).pipe(
        skipWhile(query => !query),
        take(1),
        map(query => ({action, query}))
      )
    ),
    map(({action, query}) => {
      const collectionIds = (query.collectionIds || []).concat(action.payload.collectionId);

      return newQueryAction({...query, collectionIds});
    })
  );

  @Effect()
  public removeCollectionFromQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.RemoveCollectionFromQuery>(NavigationActionType.REMOVE_COLLECTION_FROM_QUERY),
    mergeMap(action =>
      this.store$.select(selectQuery).pipe(
        skipWhile(query => !query),
        take(1),
        map(query => ({action, query}))
      )
    ),
    map(({action, query}) => {
      const collectionIds = query.collectionIds || [];
      const indexToRemove = collectionIds.findIndex(id => id === action.payload.collectionId);
      if (indexToRemove) {
        collectionIds.splice(indexToRemove, 1);
      }

      return newQueryAction({...query, collectionIds});
    })
  );

  @Effect()
  public navigateToPreviousUrl$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.NavigateToPreviousUrl>(NavigationActionType.NAVIGATE_TO_PREVIOUS_URL),
    filter(action => !!action.payload.organizationCode && !!action.payload.projectCode),
    map(action => {
      const {organizationCode, projectCode, searchTab, previousUrl} = action.payload;

      if (!previousUrl || previousUrl === '/') {
        return new RouterAction.Go({
          path: ['/', 'w', organizationCode, projectCode, 'view', 'search', searchTab || SearchTab.All],
        });
      }

      const [url] = previousUrl.split('?', 2);
      const queryParams = this.router.parseUrl(previousUrl).queryParams;

      const [, w, , , ...page] = url.split('/');
      if (w !== 'w') {
        return new RouterAction.Go({path: [url], queryParams});
      }

      const path = ['/', 'w', organizationCode, projectCode, ...page];
      return new RouterAction.Go({path, queryParams});
    })
  );

  @Effect()
  public setQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.SetQuery>(NavigationActionType.SET_QUERY),
    map(action => newQueryAction(action.payload.query))
  );

  @Effect()
  public removeViewFromUrl$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.RemoveViewFromUrl>(NavigationActionType.REMOVE_VIEW_FROM_URL),
    withLatestFrom(this.store$.select(selectNavigation)),
    filter(([action, navigation]) => !!navigation.workspace && !!navigation.perspective),
    map(([action, navigation]) => {
      const {organizationCode, projectCode} = navigation.workspace;
      const {perspective, searchTab} = navigation;

      const path: any[] = ['w', organizationCode, projectCode, ...['view', perspective]];
      if (perspective === Perspective.Search && searchTab) {
        path.push(searchTab);
      }

      const extras: NavigationExtras = action.payload.setQuery
        ? {queryParams: action.payload.setQuery}
        : {queryParamsHandling: 'merge'};
      return new RouterAction.Go({path, extras});
    })
  );

  constructor(private actions$: Actions, private router: Router, private store$: Store<AppState>) {}
}

function newQueryAction(query: QueryModel): Action {
  return new RouterAction.Go({
    path: [],
    queryParams: {
      query: QueryConverter.toString(query),
    },
    extras: {
      queryParamsHandling: 'merge',
    },
  });
}
