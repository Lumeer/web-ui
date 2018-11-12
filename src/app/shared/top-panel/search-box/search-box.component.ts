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

import {BehaviorSubject, combineLatest as observableCombineLatest, Observable, of, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ViewQueryItem} from './query-item/model/view.query-item';
import {filter, flatMap, map, tap} from 'rxjs/operators';
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
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {UserModel} from '../../../core/store/users/user.model';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {userHasManageRoleInResource} from '../../utils/resource.utils';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {AttributeQueryItem} from './query-item/model/attribute.query-item';
import {LinkQueryItem} from './query-item/model/link.query-item';

const allowAutomaticSubmission = true;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  public queryItems: QueryItem[] = [];
  public form: FormGroup;
  public queryItemsControl: FormArray;
  public currentView$ = new BehaviorSubject<ViewModel>(null);

  private subscriptions = new Subscription();

  private workspace: Workspace;
  private perspective: Perspective;
  private currentUser: UserModel;
  private queryData: QueryData;

  constructor(private router: Router, private store: Store<AppState>, private formBuilder: FormBuilder) {}

  public ngOnInit() {
    this.subscribeViewData();
    this.subscribeToQuery();
    this.subscribeToNavigation();
    this.initForm();
  }

  private subscribeViewData() {
    this.subscriptions.add(this.store.pipe(select(selectCurrentUser)).subscribe(user => (this.currentUser = user)));
    this.subscriptions.add(this.store.pipe(select(selectCurrentView)).subscribe(view => this.currentView$.next(view)));
  }

  private subscribeToQuery() {
    const querySubscription = this.store
      .pipe(select(selectQuery))
      .pipe(
        filter(query => !isNullOrUndefined(query)),
        flatMap(query => observableCombineLatest(of(query), this.loadData())),
        tap(([query, data]) => (this.queryData = data)),
        map(([query, data]) => new QueryItemsConverter(data).fromQuery(query)),
        filter(queryItems => this.itemsChanged(queryItems))
      )
      .subscribe(queryItems => {
        this.queryItems = queryItems;
        this.initForm(this.queryItems);
      });
    this.subscriptions.add(querySubscription);
  }

  private subscribeToNavigation() {
    const navigationSubscription = this.store.pipe(select(selectNavigation)).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.perspective = navigation.perspective;
    });
    this.subscriptions.add(navigationSubscription);
  }

  private loadData(): Observable<QueryData> {
    return observableCombineLatest(
      this.store.pipe(select(selectAllCollections)),
      this.store.pipe(select(selectAllLinkTypes)),
      this.store.pipe(select(selectCollectionsLoaded)),
      this.store.pipe(select(selectLinkTypesLoaded))
    ).pipe(
      filter(([collections, linkTypes, collectionsLoaded, linkTypesLoaded]) => collectionsLoaded && linkTypesLoaded),
      map(([collections, linkTypes]) => {
        return {
          collections: collections.filter(collection => collection && collection.id),
          linkTypes: linkTypes.filter(linkType => linkType && linkType.id), // TODO remove after NgRx bug is fixed
        };
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onAddQueryItem(queryItem: QueryItem) {
    this.addPrerequisiteItems(queryItem);
    this.addQueryItem(queryItem);

    this.onQueryItemsChanged();
  }

  private addPrerequisiteItems(queryItem: QueryItem) {
    const prerequisiteItems = this.getPrerequisiteQueryItems(queryItem);
    prerequisiteItems.filter(item => !this.isQueryItemPresented(item)).forEach(item => this.addQueryItem(item));
  }

  private getPrerequisiteQueryItems(queryItem: QueryItem): QueryItem[] {
    switch (queryItem.type) {
      case QueryItemType.Attribute: {
        const collectionId = (queryItem as AttributeQueryItem).collection.id;
        return new QueryItemsConverter(this.queryData).createCollectionItems([collectionId]);
      }
      case QueryItemType.Link: {
        const collectionId = (queryItem as LinkQueryItem).collectionIds[0];
        return new QueryItemsConverter(this.queryData).createCollectionItems([collectionId]);
      }
      default:
        return [];
    }
  }

  private isQueryItemPresented(queryItem: QueryItem): boolean {
    return !!this.queryItems.find(item => item.value === queryItem.value);
  }

  private addQueryItem(queryItem: QueryItem) {
    this.queryItems.push(queryItem);
    this.queryItemsControl.push(queryItemToForm(queryItem));
  }

  public onRemoveLastQueryItem() {
    const lastIndex = this.queryItems.length - 1;
    this.onRemoveQueryItem(lastIndex);
  }

  public onRemoveQueryItem(index: number) {
    if (this.shouldInvalidateQuery()) {
      this.store.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: {}}));
    } else {
      const queryItemToRemove = this.queryItems[index];
      this.removeQueryItem(index);
      this.removeDependentItems(queryItemToRemove);

      this.queryItems = [...this.queryItems];
      this.onQueryItemsChanged();
    }
  }

  private shouldInvalidateQuery(): boolean {
    const currentView = this.currentView$.getValue();
    return currentView && !userHasManageRoleInResource(this.currentUser, currentView);
  }

  private removeQueryItem(index: number) {
    this.queryItems.splice(index, 1);
    this.queryItemsControl.removeAt(index);
  }

  private removeDependentItems(removedQueryItem: QueryItem) {
    for (let i = this.queryItems.length - 1; i >= 0; i--) {
      const queryItem = this.queryItems[i];
      if (queryItem.dependsOn(removedQueryItem)) {
        this.removeQueryItem(i);
      }
    }
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
      queryItems.map(qi => queryItemToForm(qi)).forEach(it => this.queryItemsControl.push(it));
    } else {
      this.form = this.formBuilder.group({
        queryItems: this.formBuilder.array(queryItems.map(qi => queryItemToForm(qi))),
      });
      this.queryItemsControl = <FormArray>this.form.controls['queryItems'];
    }
  }

  public trackByTypeAndText(index: number, queryItem: QueryItem) {
    return queryItem.type.toString() + queryItem.text;
  }
}
