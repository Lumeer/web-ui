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
import {Router} from "@angular/router";

import {AppState} from '../../../../core/store/app.state';
import {Observable} from "rxjs/Observable";
import {selectViewsByQuery} from "../../../../core/store/views/views.state";
import {ViewsAction} from "../../../../core/store/views/views.action";
import {selectNavigation} from "../../../../core/store/navigation/navigation.state";
import {Subscription} from "rxjs/Subscription";
import {Workspace} from "../../../../core/store/navigation/workspace.model";
import {ViewModel} from "../../../../core/store/views/view.model";
import {selectAllCollections} from "../../../../core/store/collections/collections.state";
import {selectAllLinkTypes} from "../../../../core/store/link-types/link-types.state";
import {QueryData} from "../../../../shared/search-box/query-data";
import {filter} from "rxjs/operators";
import {isNullOrUndefined} from "util";

@Component({
  selector: 'search-views',
  templateUrl: './search-views.component.html'
})
export class SearchViewsComponent implements OnInit, OnDestroy {

  public views$: Observable<ViewModel[]>;

  private navigationSubscription: Subscription;
  private dataSubscription: Subscription;

  private workspace: Workspace;
  private queryData: QueryData;

  constructor(private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.views$ = this.store.select(selectViewsByQuery);
    this.subscribeToNavigation();
    this.subscribeToData();
  }

  public ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private subscribeToNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => !isNullOrUndefined(navigation.workspace))
    ).subscribe(
      navigation => {
        this.workspace = navigation.workspace;
        this.store.dispatch(new ViewsAction.Get({query: navigation.query}));
      }
    );
  }

  private subscribeToData() {
    this.dataSubscription = Observable.combineLatest(
      this.store.select(selectAllCollections),
      this.store.select(selectAllLinkTypes)
    ).subscribe(([collections, linkTypes]) => this.queryData = {collections, linkTypes});
  }

  public showView(view: ViewModel) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

}
