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
import {Router} from '@angular/router';

import {of, combineLatest as observableCombineLatest, Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {ViewQueryItem} from './query-item/model/view.query-item';
import {filter, flatMap, map, skipWhile} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectAllCollections, selectCollectionsLoaded} from '../../../core/store/collections/collections.state';
import {selectAllLinkTypes, selectLinkTypesLoaded} from '../../../core/store/link-types/link-types.state';
import {selectNavigation, selectQuery} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {ViewModel} from '../../../core/store/views/view.model';
import {Perspective} from '../../../view/perspectives/perspective';
import {QueryData} from './query-data';
import {QueryItem} from './query-item/model/query-item';
import {QueryItemType} from './query-item/model/query-item-type';
import {QueryItemsConverter} from './query-item/query-items.converter';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {queryItemToForm} from '../../../core/store/navigation/query.util';
import {isNullOrUndefined} from 'util';

const allowAutomaticSubmission = true;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html'
})
export class SearchBoxComponent implements OnInit, OnDestroy {

  public queryItems: QueryItem[] = [];
  public form: FormGroup;
  public queryItemsControl: FormArray;

  private querySubscription: Subscription;
  private navigationSubscription: Subscription;

  private workspace: Workspace;
  private perspective: Perspective;

  constructor(private router: Router,
              private store: Store<AppState>,
              private formBuilder: FormBuilder) {
  }

  public ngOnInit() {
    this.subscribeToQuery();
    this.subscribeToNavigation();
    this.initForm();
  }

  private subscribeToQuery() {
    this.querySubscription = this.store.select(selectQuery).pipe(
      filter(query => !isNullOrUndefined(query)),
      flatMap(query => observableCombineLatest(
        of(query),
        this.loadData()
      )),
      map(([query, data]) => new QueryItemsConverter(data).fromQuery(query)),
      filter(queryItems => this.itemsChanged(queryItems))
    ).subscribe(queryItems => {
      this.queryItems = queryItems;
      this.initForm(this.queryItems);
    });
  }

  private subscribeToNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation)
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.perspective = navigation.perspective;
      });
  }

  private loadData(): Observable<QueryData> {
    return observableCombineLatest(
      this.store.select(selectAllCollections),
      this.store.select(selectAllLinkTypes),
      this.store.select(selectCollectionsLoaded),
      this.store.select(selectLinkTypesLoaded)
    ).pipe(
      skipWhile(([collections, linkTypes, collectionsLoaded, linkTypesLoaded]) => !collectionsLoaded || !linkTypesLoaded),
      map(([collections, linkTypes]) => {
        return {
          collections: collections.filter(collection => collection && collection.id),
          linkTypes: linkTypes.filter(linkType => linkType && linkType.id) // TODO remove after NgRx bug is fixed
        };
      })
    );
  }

  public ngOnDestroy() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  public onAddQueryItem(queryItem: QueryItem) {
    this.queryItems.push(queryItem);
    this.queryItemsControl.push(queryItemToForm(queryItem));

    this.onQueryItemsChanged();
  }

  public onRemoveQueryItem(index: number) {
    this.queryItems.splice(index, 1);
    this.queryItemsControl.removeAt(index);

    this.onQueryItemsChanged();
  }

  public onRemoveLastQueryItem() {
    const lastIndex = this.queryItems.length - 1;
    this.queryItems.pop();
    this.queryItemsControl.removeAt(lastIndex);

    this.onQueryItemsChanged();
  }

  public onQueryItemsChanged() {
    if (allowAutomaticSubmission && this.form.valid) {
      this.onSearch();
    }
  }

  public onSearch(redirect?: boolean) {
    if (!this.form.valid) {
      return;
    }

    if (this.showView()) {
      return;
    }

    this.showByQueryItems(redirect);
  }

  private showView(): boolean {
    const viewQueryItem = this.queryItems.find(item => item.type === QueryItemType.View) as ViewQueryItem;

    if (viewQueryItem) {
      this.navigateToView(viewQueryItem.view);
    }

    return !!viewQueryItem;
  }

  private navigateToView(view: ViewModel) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

  private showByQueryItems(redirect: boolean) {
    const query = QueryItemsConverter.toQueryString(this.queryItems);
    this.navigateToQuery(query, redirect);
  }

  private navigateToQuery(query: string, redirect: boolean) {
    const searchUrl = ['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', 'search', 'all'];
    // TODO remove vc if this.workspace.viewCode is set
    const url = redirect || !this.perspective ? searchUrl : [];
    this.router.navigate(url, {queryParams: {query}});
  }

  private itemsChanged(queryItems: QueryItem[]): boolean {
    if (isNullOrUndefined(this.queryItems) || this.queryItems.length !== queryItems.length) {
      return true;
    }
    for (let i = 0; i < queryItems.length; i++) {
      if (this.queryItems[i] !== queryItems[i]) {
        return true;
      }
    }
    return false;
  }

  private initForm(queryItems: QueryItem[] = []) {
    if (this.queryItemsControl) {
      while (this.queryItemsControl.length > 0) {
        this.queryItemsControl.removeAt(0);
      }
      queryItems.map(qi => queryItemToForm(qi))
        .forEach(it => this.queryItemsControl.push(it));
    } else {
      this.form = this.formBuilder.group({
        queryItems: this.formBuilder.array(queryItems.map(qi => queryItemToForm(qi)))
      });
      this.queryItemsControl = <FormArray>this.form.controls['queryItems'];
    }
  }

  public trackByTypeAndText(index: number, queryItem: QueryItem) {
    return queryItem.type.toString() + queryItem.text;
  }

}
