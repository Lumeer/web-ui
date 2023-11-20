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

import {Store, select} from '@ngrx/store';

import {Observable, combineLatest} from 'rxjs';
import {map} from 'rxjs/operators';

import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectAllCollections, selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../core/store/link-types/link-types.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {View} from '../../../core/store/views/view';
import {selectAllViewsSorted} from '../../../core/store/views/views.state';
import {QueryData} from '../../top-panel/search-box/util/query-data';

@Component({
  selector: 'views-bookmarks',
  templateUrl: './views-bookmarks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewsBookmarksComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  public views$: Observable<View[]>;
  public queryData$: Observable<QueryData>;
  public collectionsMap$: Observable<Record<string, Collection>>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(
      select(selectAllViewsSorted),
      map(views => views.filter(view => view.favorite))
    );
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
    this.queryData$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => ({collections, linkTypes})));
  }
}
