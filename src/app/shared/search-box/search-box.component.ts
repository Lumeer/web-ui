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
import {Store} from '@ngrx/store';
import {ViewQueryItem} from './query-item/model/view.query-item';
import {Observable} from 'rxjs/Observable';
import {filter, flatMap, map} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../core/store/app.state';
import {selectAllCollections} from '../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../core/store/link-types/link-types.state';
import {selectNavigation, selectQuery} from '../../core/store/navigation/navigation.state';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {ViewModel} from '../../core/store/views/view.model';
import {Perspective} from '../../view/perspectives/perspective';
import {QueryData} from './query-data';
import {QueryItem} from './query-item/model/query-item';
import {QueryItemType} from './query-item/model/query-item-type';
import {QueryItemsConverter} from './query-item/query-items.converter';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html'
})
export class SearchBoxComponent implements OnInit, OnDestroy {

  public queryItems: QueryItem[] = [];

  private querySubscription: Subscription;
  private navigationSubscription: Subscription;

  private workspace: Workspace;
  private perspective: Perspective;

  constructor(private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToQuery();
    this.subscribeToNavigation();
  }

  private subscribeToQuery() {
    this.querySubscription = this.store.select(selectQuery).pipe(
      flatMap(query => Observable.combineLatest(
        Observable.of(query),
        this.loadData(query)
      )),
      map(([query, data]) => new QueryItemsConverter(data).fromQuery(query)),
    ).subscribe(queryItems => {
      this.queryItems = queryItems;
    });
  }

  private subscribeToNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation)
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.perspective = navigation.perspective;
      });
  }

  private loadData(query: QueryModel): Observable<QueryData> {
    return Observable.combineLatest(
      this.store.select(selectAllCollections),
      this.store.select(selectAllLinkTypes)
    ).pipe(
      map(([collections, linkTypes]) => {
        return {
          collections: collections.filter(collection => collection && collection.id),
          linkTypes: linkTypes.filter(linkType => linkType && linkType.id) // TODO remove after NgRx bug is fixed
        };
      }),
      filter(({collections, linkTypes}) => {
        const collectionIds = new Set(collections.map(collection => collection.id));
        const linkTypeIds = new Set(linkTypes.map(linkType => linkType.id));
        const linkCollectionIds: string[] = linkTypes.reduce((collectionIds, linkType) => collectionIds.concat(linkType.collectionIds), []);

        return query &&
          query.collectionIds.every(collectionId => collectionIds.has(collectionId)) &&
          query.linkTypeIds.every(linkTypeId => linkTypeIds.has(linkTypeId)) &&
          linkCollectionIds.every(collectionId => collectionIds.has(collectionId));
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
  }

  public onRemoveQueryItem(index: number) {
    this.queryItems.splice(index, 1);
  }

  public onRemoveLastQueryItem() {
    this.queryItems.pop();
  }

  public onSearch(redirect?: boolean) {
    if (!this.areAllQueryItemsCompleted()) {
      return;
    }

    if (this.showView()) {
      return;
    }

    this.showByQueryItems(redirect);
  }

  private areAllQueryItemsCompleted(): boolean {
    return this.queryItems.every(item => item.isComplete());
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
    const completedQueryItems = this.queryItems.filter(queryItem => queryItem.isComplete());
    const query = QueryItemsConverter.toQueryString(completedQueryItems);
    this.navigateToQuery(query, redirect);
  }

  private navigateToQuery(query: string, redirect: boolean) {
    const searchUrl = ['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', 'search', 'all'];
    // TODO remove vc if this.workspace.viewCode is set
    const url = redirect || !this.perspective ? searchUrl : [];
    this.router.navigate(url, {queryParams: {query}});
  }

}
