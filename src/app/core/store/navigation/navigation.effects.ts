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
import {NavigationExtras, Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map, withLatestFrom} from 'rxjs/operators';
import {Perspective} from '../../../view/perspectives/perspective';
import {ModuleLazyLoadingService} from '../../service/module-lazy-loading.service';
import {AppState} from '../app.state';
import {RouterAction} from '../router/router.action';
import {NavigationAction, NavigationActionType} from './navigation.action';
import {selectNavigation} from './navigation.state';
import {QueryParam} from './query-param';
import {Query, QueryStem} from './query/query';
import {convertQueryModelToString} from './query/query.converter';
import {convertViewCursorToString} from './view-cursor/view-cursor';
import {selectViewQuery} from '../views/views.state';

@Injectable()
export class NavigationEffects {
  public addLinkToQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.AddLinkToQuery>(NavigationActionType.ADD_LINK_TO_QUERY),
      withLatestFrom(this.store$.pipe(select(selectViewQuery))),
      map(([action, query]) => {
        const stem: QueryStem = query.stems[0]; // TODO be aware when using with more than 1 stem
        const linkTypeIds = (stem.linkTypeIds || []).concat(action.payload.linkTypeId);
        const newStem = {...stem, linkTypeIds};

        return newQueryAction({...query, stems: [newStem]});
      })
    )
  );

  public addCollectionToQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.AddCollectionToQuery>(NavigationActionType.ADD_COLLECTION_TO_QUERY),
      withLatestFrom(this.store$.pipe(select(selectViewQuery))),
      map(([action, query]) => {
        const stems = query.stems || [];
        stems.push({collectionId: action.payload.collectionId});

        return newQueryAction({...query, stems});
      })
    )
  );

  public navigateToPreviousUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.NavigateToPreviousUrl>(NavigationActionType.NAVIGATE_TO_PREVIOUS_URL),
      filter(action => !!action.payload.organizationCode && !!action.payload.projectCode),
      map(action => {
        const {organizationCode, projectCode, previousUrl} = action.payload;

        if (!previousUrl || previousUrl === '/') {
          return new RouterAction.Go({
            path: ['/', 'w', organizationCode, projectCode, 'view', 'search'],
          });
        }

        const [url] = previousUrl.split('?', 2);
        const queryParams = this.router.parseUrl(previousUrl).queryParams;
        return new RouterAction.Go({path: [url], queryParams});
      })
    )
  );

  public setQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.SetQuery>(NavigationActionType.SET_QUERY),
      map(action => newQueryAction(action.payload.query))
    )
  );

  public setViewCursor$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.SetViewCursor>(NavigationActionType.SET_VIEW_CURSOR),
      withLatestFrom(this.moduleLazyLoadingService.observeLazyLoading()),
      // otherwise it fails to redirect to lazy loaded module when cursor is being changed at the same time
      filter(([, lazyLoading]) => !lazyLoading),
      map(
        ([action]) =>
          new RouterAction.Go({
            path: [],
            queryParams: {
              [QueryParam.ViewCursor]: convertViewCursorToString(action.payload.cursor) || null,
            },
            extras: {
              replaceUrl: true,
              queryParamsHandling: 'merge',
            },
          })
      )
    )
  );

  public removeViewFromUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType<NavigationAction.RemoveViewFromUrl>(NavigationActionType.REMOVE_VIEW_FROM_URL),
      withLatestFrom(this.store$.pipe(select(selectNavigation))),
      filter(([, navigation]) => !!navigation.workspace && !!navigation.perspective),
      map(([action, navigation]) => {
        const {organizationCode, projectCode} = navigation.workspace;
        const {perspective, searchTab} = navigation;

        const path: any[] = ['w', organizationCode, projectCode, 'view', perspective];
        if (perspective === Perspective.Search && searchTab) {
          path.push(searchTab);
        }

        const queryParams = {};
        if (action.payload.setQuery) {
          queryParams[QueryParam.Query] = convertQueryModelToString(action.payload.setQuery);
        }
        if (action.payload.cursor) {
          queryParams[QueryParam.ViewCursor] = convertViewCursorToString(action.payload.cursor);
        }

        const extras: NavigationExtras = {queryParams, queryParamsHandling: 'merge'};
        return new RouterAction.Go({path, extras});
      })
    )
  );

  constructor(
    private actions$: Actions,
    private moduleLazyLoadingService: ModuleLazyLoadingService,
    private router: Router,
    private store$: Store<AppState>
  ) {}
}

function newQueryAction(query: Query): Action {
  return new RouterAction.Go({
    path: [],
    queryParams: {
      [QueryParam.Query]: convertQueryModelToString(query),
    },
    extras: {
      queryParamsHandling: 'merge',
    },
  });
}
