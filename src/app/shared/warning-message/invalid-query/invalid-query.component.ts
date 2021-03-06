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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {selectReadableCollections, selectCollectionsInQuery} from '../../../core/store/common/permissions.selectors';
import {map, mergeMap, take} from 'rxjs/operators';
import {Query} from '../../../core/store/navigation/query/query';
import {queryIsEmptyExceptPagination} from '../../../core/store/navigation/query/query.util';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {sortResourcesByFavoriteAndLastUsed} from '../../utils/resource.utils';

@Component({
  selector: 'invalid-query',
  templateUrl: './invalid-query.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidQueryComponent implements OnInit {
  @Input()
  public minStems: number;

  @Input()
  public maxStems: number;

  public collections$: Observable<Collection[]>;
  public hasCollection$: Observable<boolean>;
  public query$: Observable<Query>;
  public stemsLength$: Observable<number>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.stemsLength$ = this.store$.pipe(
      select(selectViewQuery),
      map(query => query?.stems?.length || 0)
    );
    this.collections$ = this.store$.pipe(
      select(selectViewQuery),
      mergeMap(query =>
        queryIsEmptyExceptPagination(query)
          ? this.store$.pipe(select(selectReadableCollections))
          : this.store$.pipe(select(selectCollectionsInQuery))
      ),
      map(collections => sortResourcesByFavoriteAndLastUsed(collections))
    );
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.hasCollection$ = this.store$.pipe(
      select(selectReadableCollections),
      map(collections => collections?.length > 0)
    );
  }

  public onCollectionSelect(data: {collection: Collection; index: number}) {
    this.store$.pipe(select(selectViewQuery), take(1)).subscribe(query => {
      let stem = ((query && query.stems) || [])[data.index];
      if (!stem) {
        stem = {collectionId: data.collection.id};
      }
      const newQuery: Query = {...query, stems: [stem], fulltexts: query && query.fulltexts};
      this.store$.dispatch(new NavigationAction.SetQuery({query: newQuery}));
    });
  }
}
