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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {View} from '../../../../core/store/views/view';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectViewById} from '../../../../core/store/views/views.state';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {QueryItemsConverter} from '../../../top-panel/search-box/query-item/query-items.converter';
import {queryItemsColor} from '../../../../core/store/navigation/query/query.util';
import {perspectiveIconsMap} from '../../../../view/perspectives/perspective';

@Component({
  selector: 'view-header',
  templateUrl: './view-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'p-3 text-center bg-success text-white w-100 rounded-top'},
})
export class ViewHeaderComponent implements OnInit {
  @Input()
  public viewId: string;

  @Input()
  public prefix: string;

  public view$: Observable<View>;
  public viewColor$: Observable<string>;
  public viewIcon$: Observable<string>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.view$ = this.store$.pipe(select(selectViewById(this.viewId)));

    this.viewIcon$ = this.view$.pipe(map(view => perspectiveIconsMap[view?.perspective] || ''));

    // currently not used due to bad contrast color with success background
    this.viewColor$ = combineLatest([
      this.view$,
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(
      map(([view, collections, linkTypes]) => new QueryItemsConverter({collections, linkTypes}).fromQuery(view.query)),
      map(queryItems => queryItemsColor(queryItems))
    );
  }
}
