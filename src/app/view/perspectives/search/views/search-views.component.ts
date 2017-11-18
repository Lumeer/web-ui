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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';

import {View} from '../../../../core/dto/view';
import {Subscription} from 'rxjs/Subscription';
import {map, switchMap} from 'rxjs/operators';
import {SearchService} from '../../../../core/rest/search.service';
import {AppState} from '../../../../core/store/app.state';
import {QueryConverter} from '../../../../shared/utils/query-converter';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';

@Component({
  templateUrl: './search-views.component.html'
})
export class SearchViewsComponent implements OnInit, OnDestroy {

  public views: View[];

  private routerSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.routerSubscription = this.store.select(selectNavigation).pipe(
      map(navigation => navigation.query),
      map(query => QueryConverter.removeLinksFromQuery(query)),
      switchMap(query => this.searchService.searchViews(query)),
    ).subscribe(views => this.views = views);
  }

  public ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

}
