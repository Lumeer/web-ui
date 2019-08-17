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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Query} from '../../../core/store/navigation/query/query';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {DEFAULT_SEARCH_ID} from '../../../core/store/searches/search';
import {selectSearchById} from '../../../core/store/searches/searches.state';
import {ViewConfig} from '../../../core/store/views/view';
import {SearchesAction} from '../../../core/store/searches/searches.action';

@Component({
  templateUrl: './search-perspective.component.html',
  styleUrls: ['./search-perspective.component.scss'],
})
export class SearchPerspectiveComponent implements OnInit, OnDestroy {
  private query: Query = {};
  private subscriptions = new Subscription();
  private searchId = DEFAULT_SEARCH_ID;

  constructor(private store$: Store<AppState>, private activatedRoute: ActivatedRoute) {}

  public ngOnInit() {
    this.initConfig();
    this.store$.pipe(select(selectQuery)).subscribe(query => (this.query = query));
  }

  public isLinkActive(url: string): boolean {
    return this.activatedRoute.firstChild.snapshot.url.join('/').includes(url);
  }

  public stringifyQuery(): string {
    return convertQueryModelToString(this.query);
  }

  private initConfig() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectSearchById(this.searchId))))
      )
      .subscribe(([view, search]) => {
        if (search) {
          this.refreshSearch(view && view.config);
        } else {
          this.createSearch();
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshSearch(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.search) {
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config: viewConfig.search}));
    }
  }

  private createSearch() {
    const search = {id: this.searchId, config: {}};
    this.store$.dispatch(new SearchesAction.AddSearch({search}));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new SearchesAction.RemoveSearch({searchId: this.searchId}));
  }
}
