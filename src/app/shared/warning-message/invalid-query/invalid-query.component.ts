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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {
  selectReadableCollectionsByView,
  selectCollectionsByCustomViewAndQuery,
  selectCollectionsInCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {map} from 'rxjs/operators';
import {Query} from '../../../core/store/navigation/query/query';
import {
  createOpenCollectionQuery,
  queryContainsOnlyFulltexts,
  queryIsEmptyExceptPagination,
} from '../../../core/store/navigation/query/query.util';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {sortResourcesByFavoriteAndLastUsed} from '../../utils/resource.utils';
import {View} from '../../../core/store/views/view';

@Component({
  selector: 'invalid-query',
  templateUrl: './invalid-query.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidQueryComponent implements OnChanges {
  @Input()
  public minStems: number;

  @Input()
  public maxStems: number;

  @Input()
  public query: Query;

  @Input()
  public view: View;

  public collections$: Observable<Collection[]>;
  public hasCollection$: Observable<boolean>;

  public stemsLength: number;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.query) {
      this.stemsLength = this.query?.stems?.length || 0;
    }
    if (changes.query || changes.view) {
      const collectionsObservable$ = queryIsEmptyExceptPagination(this.query)
        ? this.store$.pipe(select(selectReadableCollectionsByView(this.view)))
        : queryContainsOnlyFulltexts(this.query)
        ? this.store$.pipe(select(selectCollectionsByCustomViewAndQuery(this.view, this.query)))
        : this.store$.pipe(select(selectCollectionsInCustomQuery(this.query)));
      this.collections$ = collectionsObservable$.pipe(
        map(collections => sortResourcesByFavoriteAndLastUsed(collections))
      );
    }
    if (changes.view) {
      this.hasCollection$ = this.store$.pipe(
        select(selectReadableCollectionsByView(this.view)),
        map(collections => collections?.length > 0)
      );
    }
  }

  public onCollectionSelect(data: {collection: Collection; index: number}) {
    const query = createOpenCollectionQuery(data.collection, this.view?.query || this.query);
    this.store$.dispatch(new NavigationAction.SetQuery({query}));
  }
}
