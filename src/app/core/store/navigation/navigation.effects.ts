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
import {Action, select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, map, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {RouterAction} from '../router/router.action';
import {NavigationAction, NavigationActionType} from './navigation.action';
import {selectNavigation, selectQuery} from './navigation.state';
import {convertQueryModelToString} from './query.converter';
import {SearchTab} from './search-tab';
import {Perspective} from '../../../view/perspectives/perspective';
import {Query, QueryStem} from './query';
import {DialogPath} from '../../../dialog/dialog-path';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {filterStemByAttributeIds, filterStemByLinkIndex} from './query.util';

@Injectable()
export class NavigationEffects {
  @Effect()
  public addLinkToQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.AddLinkToQuery>(NavigationActionType.ADD_LINK_TO_QUERY),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    map(([action, query]) => {
      const stem: QueryStem = query.stems[0]; // TODO be aware when using with more than 1 stem
      const linkTypeIds = (stem.linkTypeIds || []).concat(action.payload.linkTypeId);
      const newStem = {...stem, linkTypeIds};

      return newQueryAction({...query, stems: [newStem]});
    })
  );

  @Effect()
  public removeLinkFromQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.RemoveLinkFromQuery>(NavigationActionType.REMOVE_LINK_FROM_QUERY),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    withLatestFrom(this.store$.pipe(select(selectAllLinkTypes))),
    map(([[action, query], linkTypes]) => {
      const {linkTypeId} = action.payload;
      const newStems: QueryStem[] = [];

      for (const stem of query.stems || []) {
        const linkTypeIndex = (stem.linkTypeIds || []).findIndex(id => id === linkTypeId);
        if (linkTypeIndex >= 0) {
          newStems.push(filterStemByLinkIndex(stem, linkTypeIndex, linkTypes));
        } else {
          newStems.push(stem);
        }
      }

      return newQueryAction({...query, stems: newStems});
    })
  );

  @Effect()
  public removeAttributesFromQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.RemoveAttributesFromQuery>(NavigationActionType.REMOVE_ATTRIBUTES_FROM_QUERY),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    map(([action, query]) => {
      const {collectionId, attributeIds} = action.payload;
      const newStems = (query.stems || []).map(stem => filterStemByAttributeIds(stem, collectionId, attributeIds));
      return newQueryAction({...query, stems: newStems});
    })
  );

  @Effect()
  public addCollectionToQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.AddCollectionToQuery>(NavigationActionType.ADD_COLLECTION_TO_QUERY),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    map(([action, query]) => {
      const stems = query.stems || [];
      stems.push({collectionId: action.payload.collectionId});

      return newQueryAction({...query, stems});
    })
  );

  @Effect()
  public removeCollectionFromQuery$: Observable<Action> = this.actions$.pipe(
    ofType<NavigationAction.RemoveCollectionFromQuery>(NavigationActionType.REMOVE_COLLECTION_FROM_QUERY),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    withLatestFrom(this.store$.pipe(select(selectAllLinkTypes))),
    map(([[action, query], linkTypes]) => {
      const {collectionId} = action.payload;
      const newStems: QueryStem[] = [];

      for (const stem of query.stems || []) {
        if (stem.collectionId !== collectionId) {
          const linkTypeIndex = (stem.linkTypeIds || [])
            .map(id => linkTypes.find(lt => lt.id === id))
            .findIndex(linkType => !linkType || linkType.collectionIds.includes(collectionId));
          if (linkTypeIndex >= 0) {
            newStems.push(filterStemByLinkIndex(stem, linkTypeIndex, linkTypes));
          } else {
            newStems.push(stem);
          }
        }
      }

      return newQueryAction({...query, stems: newStems});
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
    withLatestFrom(this.store$.pipe(select(selectNavigation))),
    filter(([action, navigation]) => !!navigation.workspace && !!navigation.perspective),
    map(([action, navigation]) => {
      const {organizationCode, projectCode} = navigation.workspace;
      const {perspective, searchTab} = navigation;

      const path: any[] = ['w', organizationCode, projectCode, 'view', perspective];
      if (perspective === Perspective.Search && searchTab) {
        path.push(searchTab);
      }

      const extras: NavigationExtras = action.payload.setQuery
        ? {queryParams: action.payload.setQuery}
        : {queryParamsHandling: 'merge'};

      const containsViewDialog = this.router.url.includes(`dialog:${DialogPath.SHARE_VIEW}`);
      let nextAction: Action = null;
      if (containsViewDialog) {
        const removeDialogPath: any[] = ['', {outlets: {dialog: null}}];
        nextAction = new RouterAction.Go({path: removeDialogPath, extras});
      }

      return new RouterAction.Go({path, extras, nextAction});
    })
  );

  constructor(private actions$: Actions, private router: Router, private store$: Store<AppState>) {}
}

function newQueryAction(query: Query): Action {
  return new RouterAction.Go({
    path: [],
    queryParams: {
      query: convertQueryModelToString(query),
    },
    extras: {
      queryParamsHandling: 'merge',
    },
  });
}
