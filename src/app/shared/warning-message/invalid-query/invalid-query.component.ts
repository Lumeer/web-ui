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
import {
  selectCollectionsByQueryWithoutLinks,
  selectCollectionsByReadPermission,
} from '../../../core/store/common/permissions.selectors';
import {map, take} from 'rxjs/operators';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {getQueryFiltersForCollection} from '../../../core/store/navigation/query/query.util';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';

@Component({
  selector: 'invalid-query',
  templateUrl: './invalid-query.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidQueryComponent implements OnInit {
  @Input()
  public minCollections: number;

  @Input()
  public maxCollections: number;

  public collections$: Observable<Collection[]>;
  public currentCollectionsLength$: Observable<number>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByReadPermission));
    this.currentCollectionsLength$ = this.store$.pipe(
      select(selectCollectionsByQueryWithoutLinks),
      map(collections => (collections || []).length)
    );
  }

  public onCollectionSelect(collection: Collection) {
    this.store$
      .pipe(
        select(selectQuery),
        take(1)
      )
      .subscribe(query => {
        const filters = getQueryFiltersForCollection(query, collection.id);
        const newQuery: Query = {...query, stems: [{collectionId: collection.id, filters}]};
        this.store$.dispatch(new NavigationAction.SetQuery({query: newQuery}));
      });
  }
}
