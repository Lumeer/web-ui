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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
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
import {LinkQueryItem} from './query-item/model/link.query-item';
import {CollectionQueryItem} from './query-item/model/collection.query-item';
import {arrayIntersection} from '../../utils/array.utils';
import {getOtherLinkedCollectionId} from '../../utils/link-type.utils';
import {DocumentQueryItem} from './query-item/model/documents.query-item';
import {AttributeQueryItem} from './query-item/model/attribute.query-item';

const allowAutomaticSubmission = true;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  public currentView$ = new BehaviorSubject<ViewModel>(null);
  public queryItems$ = new BehaviorSubject<QueryItem[]>([]);
  public form$ = new BehaviorSubject<FormGroup>(null);
  public queryItemsControl: FormArray;

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
        this.queryItems$.next(queryItems);
        this.initForm(queryItems);
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
          linkTypes: linkTypes.filter(linkType => linkType && linkType.id),
        };
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onAddQueryItem(queryItem: QueryItem) {
    this.addQueryItemWithRelatedItems(queryItem);
    this.onQueryItemsChanged();
  }

  private addQueryItemWithRelatedItems(queryItem: QueryItem) {
    switch (queryItem.type) {
      case QueryItemType.Collection:
        return this.addItemBeforeFulltexts(queryItem);
      case QueryItemType.Link:
        return this.addLinkItem(queryItem as LinkQueryItem);
      case QueryItemType.Attribute:
        return this.addAttributeItem(queryItem as AttributeQueryItem);
      case QueryItemType.Document:
        return this.addDocumentItem(queryItem as DocumentQueryItem);
      case QueryItemType.Fulltext:
        return this.addItemToEnd(queryItem);
    }
  }

  private addItemBeforeFulltexts(queryItem: QueryItem) {
    const queryItems = this.queryItems$.getValue();
    const fulltextIndex = queryItems.findIndex(queryItem => queryItem.type === QueryItemType.Fulltext);
    const insertIndex = Math.max(fulltextIndex - 1, 0);
    this.addQueryItemAtIndex(queryItem, insertIndex);
  }

  private addLinkItem(linkItem: LinkQueryItem) {
    const queryItems = this.queryItems$.getValue();
    let added = false;
    for (let i = queryItems.length - 1; i >= 0; i--) {
      const queryItem = queryItems[i];
      if (queryItem.type === QueryItemType.Link) {
        if (arrayIntersection(linkItem.collectionIds, (queryItem as LinkQueryItem).collectionIds).length > 0) {
          this.addQueryItemAtIndex(linkItem, i + 1);
          added = true;
          break;
        }
      } else if (queryItem.type === QueryItemType.Collection) {
        if (linkItem.collectionIds.includes((queryItem as CollectionQueryItem).collection.id)) {
          this.addQueryItemAtIndex(linkItem, i + 1);
          added = true;
          break;
        }
      }
    }

    if (!added) {
      const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(linkItem.collectionIds[0]);
      this.addItemBeforeFulltexts(collectionItem);
      this.addItemBeforeFulltexts(linkItem);
    }
  }

  private addAttributeItem(attributeItem: AttributeQueryItem) {
    const queryStartData = this.findQueryStemStartIndexForCollection(attributeItem.collection.id);
    if (queryStartData) {
      const queryItems = this.queryItems$.getValue();
      const {index, distanceFromCollection} = queryStartData;
      const foundAttributeCollectionIds = new Set();
      let added = false;
      for (let i = index + 1; i < queryItems.length; i++) {
        const queryItem = queryItems[i];
        if (queryItem.type === QueryItemType.Attribute) {
          const currentAttributeItem = queryItem as AttributeQueryItem;
          if (currentAttributeItem.collection.id !== attributeItem.collection.id) {
            foundAttributeCollectionIds.add(currentAttributeItem.collection.id);

            if (distanceFromCollection < foundAttributeCollectionIds.size) {
              // we found attributeItem which should be behind adding item
              this.addQueryItemAtIndex(attributeItem, i);
              added = true;
              break;
            }
          }
        } else if ([QueryItemType.Collection, QueryItemType.Document].includes(queryItem.type)) {
          // index is now at the end of attributes or at the start of another query stem
          this.addQueryItemAtIndex(attributeItem, i);
          added = true;
          break;
        }
      }

      if (!added) {
        this.addItemBeforeFulltexts(attributeItem);
      }
    } else {
      const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(attributeItem.collection.id);
      this.addItemBeforeFulltexts(collectionItem);
      this.addItemBeforeFulltexts(attributeItem);
    }
  }

  private addDocumentItem(documentQueryItem: DocumentQueryItem) {
    const queryStartData = this.findQueryStemStartIndexForCollection(documentQueryItem.document.collectionId);
    if (queryStartData) {
      const queryItems = this.queryItems$.getValue();
      const {index, distanceFromCollection} = queryStartData;
      const foundDocumentCollectionIds = new Set();
      let added = false;
      for (let i = index + 1; i < queryItems.length; i++) {
        const queryItem = queryItems[i];
        if (queryItem.type === QueryItemType.Document) {
          const currentDocumentItem = queryItem as DocumentQueryItem;
          if (currentDocumentItem.document.collectionId !== documentQueryItem.document.collectionId) {
            foundDocumentCollectionIds.add(currentDocumentItem.document.collectionId);

            if (distanceFromCollection < foundDocumentCollectionIds.size) {
              // we found documentItem which should be behind adding item
              this.addQueryItemAtIndex(documentQueryItem, i);
              added = true;
              break;
            }
          }
        } else if (queryItem.type === QueryItemType.Collection) {
          // index is now at the end of documents or at the start of another query stem
          this.addQueryItemAtIndex(documentQueryItem, i);
          added = true;
          break;
        }
      }

      if (!added) {
        this.addItemBeforeFulltexts(documentQueryItem);
      }
    } else {
      const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(
        documentQueryItem.document.collectionId
      );
      this.addItemBeforeFulltexts(collectionItem);
      this.addItemBeforeFulltexts(documentQueryItem);
    }
  }

  private findQueryStemStartIndexForCollection(collectionId: string): {index: number; distanceFromCollection: number} {
    const queryItems = this.queryItems$.getValue();
    let properLinkIndex = -1;
    for (let index = queryItems.length - 1; index >= 0; index--) {
      const queryItem = queryItems[index];
      if (queryItem.type === QueryItemType.Link) {
        if ((queryItem as LinkQueryItem).collectionIds.includes(collectionId)) {
          properLinkIndex = index;
        }
      } else if (properLinkIndex !== -1 || queryItem.type === QueryItemType.Collection) {
        if (properLinkIndex !== -1 || collectionId === (queryItem as CollectionQueryItem).collection.id) {
          const distanceFromCollection = Math.max(0, properLinkIndex - index);
          return {index, distanceFromCollection};
        }
      }
    }
    return null;
  }

  private addItemToEnd(queryItem: QueryItem) {
    const lastIndex = this.queryItems$.getValue().length;
    this.addQueryItemAtIndex(queryItem, lastIndex);
  }

  private addQueryItemAtIndex(queryItem: QueryItem, index: number) {
    const currentQueryItems = this.queryItems$.getValue();
    currentQueryItems.splice(index, 0, queryItem);
    this.queryItems$.next(currentQueryItems);
    this.queryItemsControl.insert(index, queryItemToForm(queryItem));
  }

  public onRemoveLastQueryItem() {
    const lastIndex = this.queryItems$.getValue().length - 1;
    this.onRemoveQueryItem(lastIndex);
  }

  public onRemoveQueryItem(index: number) {
    if (this.shouldInvalidateQuery()) {
      this.store.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: {}}));
    } else {
      this.removeQueryItemWithRelatedItems(index);
      this.onQueryItemsChanged();
    }
  }

  private shouldInvalidateQuery(): boolean {
    const currentView = this.currentView$.getValue();
    return currentView && !userHasManageRoleInResource(this.currentUser, currentView);
  }

  private removeQueryItemWithRelatedItems(index: number) {
    const queryItem = this.queryItems$.getValue()[index];
    switch (queryItem.type) {
      case QueryItemType.Collection:
        return this.removeQueryStemFromIndex(index);
      case QueryItemType.Link:
        return this.removeLinkTypesFromIndex(index);
      case QueryItemType.Attribute:
        return this.removeQueryItem(index);
      case QueryItemType.Document:
        return this.removeQueryItem(index);
      case QueryItemType.Fulltext:
        return this.removeQueryItem(index);
    }
  }

  private removeQueryStemFromIndex(index: number) {
    const endIndex = this.findEndOfQueryStemFromIndex(index);
    if (endIndex < 0) {
      return;
    }
    for (let i = endIndex; i >= index; i--) {
      this.removeQueryItem(i);
    }
  }

  private findEndOfQueryStemFromIndex(index: number) {
    const queryItems = this.queryItems$.getValue();
    if (queryItems.length - 1 === index) {
      return index;
    }
    for (let i = index + 1; i < queryItems.length; i++) {
      const queryItem = queryItems[i];
      if (queryItem.type === QueryItemType.Collection || QueryItemType.Fulltext) {
        return i - 1;
      }
    }

    return queryItems.length - 1;
  }

  private removeLinkTypesFromIndex(index: number) {
    const removedCollectionIds = new Set();
    const queryItems = this.queryItems$.getValue();

    const removingQueryItem = queryItems[index] as LinkQueryItem;
    const previousQueryItem = queryItems[index - 1];

    let connectedCollectionId: string;
    if (previousQueryItem.type === QueryItemType.Collection) {
      connectedCollectionId = (previousQueryItem as CollectionQueryItem).collection.id;
    } else {
      connectedCollectionId = arrayIntersection(
        removingQueryItem.collectionIds,
        (previousQueryItem as LinkQueryItem).collectionIds
      )[0];
    }

    let currentQueryItem: QueryItem = removingQueryItem;
    while (currentQueryItem && currentQueryItem.type === QueryItemType.Link) {
      const otherCollectionId = getOtherLinkedCollectionId(removingQueryItem.linkType, connectedCollectionId);
      removedCollectionIds.add(otherCollectionId);
      this.removeQueryItem(index);

      connectedCollectionId = otherCollectionId;
      currentQueryItem = this.queryItems$.getValue()[index];
    }

    this.removeLinkRelatedItemsToNextStem(index, removedCollectionIds);
  }

  private removeLinkRelatedItemsToNextStem(index: number, collectionIds: Set<string>) {
    const endIndex = this.findEndOfQueryStemFromIndex(index);
    if (endIndex < 0) {
      return;
    }
    const queryItems = this.queryItems$.getValue();
    for (let i = endIndex; i >= index; i--) {
      const queryItem = queryItems[i];
      if (queryItem.type === QueryItemType.Document) {
        if (collectionIds.has((queryItem as DocumentQueryItem).document.collectionId)) {
          this.removeQueryItem(i);
        }
      } else if (queryItem.type === QueryItemType.Attribute) {
        if (collectionIds.has((queryItem as AttributeQueryItem).collection.id)) {
          this.removeQueryItem(i);
        }
      } else {
        return;
      }
    }
  }

  private removeQueryItem(index: number) {
    const queryItems = this.queryItems$.getValue();
    this.queryItems$.next(queryItems.splice(index, 1));
    this.queryItemsControl.removeAt(index);
  }

  public onQueryItemsChanged() {
    if (allowAutomaticSubmission && this.form$.getValue().valid) {
      this.onSearch();
    }
  }

  public onSearch(redirect?: boolean) {
    if (!this.form$.getValue().valid) {
      return;
    }

    if (this.showView()) {
      return;
    }

    this.showByQueryItems(redirect);
  }

  private showView(): boolean {
    const viewQueryItem = this.queryItems$.getValue().find(item => item.type === QueryItemType.View) as ViewQueryItem;

    if (viewQueryItem) {
      this.navigateToView(viewQueryItem.view);
    }

    return !!viewQueryItem;
  }

  private navigateToView(view: ViewModel) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

  private showByQueryItems(redirect: boolean) {
    const query = QueryItemsConverter.toQueryString(this.queryItems$.getValue());
    this.navigateToQuery(query, redirect);
  }

  private navigateToQuery(query: string, redirect: boolean) {
    const searchUrl = ['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', 'search', 'all'];
    const url = redirect || !this.perspective ? searchUrl : [];
    this.router.navigate(url, {queryParams: {query}});
  }

  private itemsChanged(queryItems: QueryItem[]): boolean {
    const currentQueryItems = this.queryItems$.getValue();
    if (isNullOrUndefined(currentQueryItems) || currentQueryItems.length !== queryItems.length) {
      return true;
    }
    for (let i = 0; i < queryItems.length; i++) {
      if (currentQueryItems[i] !== queryItems[i]) {
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
      const form = this.formBuilder.group({
        queryItems: this.formBuilder.array(queryItems.map(qi => queryItemToForm(qi))),
      });
      this.queryItemsControl = <FormArray>form.controls['queryItems'];
      this.form$.next(form);
    }
  }

  public trackByTypeAndText(index: number, queryItem: QueryItem) {
    return queryItem.type.toString() + queryItem.text;
  }
}
