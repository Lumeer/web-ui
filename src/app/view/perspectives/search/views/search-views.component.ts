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
import {SearchService} from '../../../../core/rest/search.service';
import {AppState} from '../../../../core/store/app.state';
import {Observable} from "rxjs/Observable";
import {selectViewsByQuery} from "../../../../core/store/views/views.state";
import {ViewsAction, ViewsActionType} from "../../../../core/store/views/views.action";
import {selectNavigation} from "../../../../core/store/navigation/navigation.state";
import {Subscription} from "rxjs/Subscription";
import {perspectiveIconsMap} from "../../perspective";

@Component({
  templateUrl: './search-views.component.html'
})
export class SearchViewsComponent implements OnInit, OnDestroy {

  public views$: Observable<View[]>;

  private navigationSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.views$ = this.store.select(selectViewsByQuery);
    this.navigationSubscription = this.store.select(selectNavigation).subscribe(
      navigation => this.store.dispatch(new ViewsAction.Get({query: navigation.query}))
    );
  }

  public ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  public getIconForPerspective(perspective: string): string {
    return perspectiveIconsMap[perspective] || '';
  }

}
