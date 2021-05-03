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

import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {QueryItem} from '../query-item/model/query-item';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {selectCurrentView} from '../../../../core/store/views/views.state';
import {QueryItemType} from '../query-item/model/query-item-type';
import {CollectionQueryItem} from '../query-item/model/collection.query-item';

const MIN_ITEMS_TO_COLLAPSE = 6;

export interface SearchBoxData {
  expandedStemIds: string[];
  collapsibleStemIds: string[];
  stemTextsMap: Record<string, string>;
}

export class SearchBoxService {
  public data$: Observable<SearchBoxData>;

  private expandedStemIds$ = new BehaviorSubject<string[]>([]);
  private collapsibleStemIds$ = new BehaviorSubject<string[]>([]);
  private stemTextsMap$ = new BehaviorSubject<Record<string, string>>({});

  private lastCheckedViewId: string;

  constructor(private store$: Store<AppState>, private readonly queryItems$: Observable<QueryItem[]>) {
    this.subscribeData();
  }

  private subscribeData() {
    this.data$ = combineLatest([this.expandedStemIds$, this.collapsibleStemIds$, this.stemTextsMap$]).pipe(
      map(([expandedStemIds, collapsibleStemIds, stemTextsMap]) => ({
        expandedStemIds,
        collapsibleStemIds,
        stemTextsMap,
      }))
    );

    combineLatest([
      this.queryItems$,
      this.store$.pipe(select(selectCurrentView)),
    ]).subscribe(([queryItems, currentView]) => this.checkShouldCollapseInitially(queryItems, currentView?.id));
  }

  private checkShouldCollapseInitially(queryItems: QueryItem[], viewId: string) {
    if (viewId && this.lastCheckedViewId !== viewId) {
      const shouldCollapse = queryItems.length >= MIN_ITEMS_TO_COLLAPSE;
      if (shouldCollapse) {
        const collectionItems = queryItems
          .filter(queryItem => queryItem.type === QueryItemType.Collection)
          .map(queryItem => (<CollectionQueryItem>queryItem).stemId);
        this.collapsibleStemIds$.next(collectionItems);
      } else {
        this.collapsibleStemIds$.next([]);
      }
    }
    this.lastCheckedViewId = viewId;
  }

  public expand(stemId: string) {
    const expanded = [...this.expandedStemIds$.value];
    if (!expanded.includes(stemId)) {
      this.expandedStemIds$.next([...expanded, stemId]);
    }
  }

  public toggleExpand(stemId: string) {
    const expanded = [...this.expandedStemIds$.value];
    if (expanded.includes(stemId)) {
      this.expandedStemIds$.next(expanded.filter(id => id !== stemId));
    } else {
      this.expandedStemIds$.next([...expanded, stemId]);
    }
  }

  public changeText(stemId: string, text: string) {
    const updatedMap = {...this.stemTextsMap$.value, [stemId]: text};
    this.stemTextsMap$.next(updatedMap);
  }
}
