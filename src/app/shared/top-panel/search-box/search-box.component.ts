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
import {Workspace} from '../../../core/store/navigation/workspace';
import {View} from '../../../core/store/views/view';
import {Perspective} from '../../../view/perspectives/perspective';
import {QueryData} from './query-data';
import {QueryItem} from './query-item/model/query-item';
import {QueryItemType} from './query-item/model/query-item-type';
import {
  convertQueryItemsToQueryModel,
  convertQueryItemsToString,
  QueryItemsConverter,
} from './query-item/query-items.converter';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {filterStemByLinkIndex, queryItemToForm} from '../../../core/store/navigation/query.util';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {User} from '../../../core/store/users/user';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {userHasManageRoleInResource, userIsManagerInWorkspace} from '../../utils/resource.utils';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {LinkQueryItem} from './query-item/model/link.query-item';
import {CollectionQueryItem} from './query-item/model/collection.query-item';
import {getArrayDifference} from '../../utils/array.utils';
import {DocumentQueryItem} from './query-item/model/documents.query-item';
import {AttributeQueryItem} from './query-item/model/attribute.query-item';
import {Query} from '../../../core/store/navigation/query';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {selectWorkspaceModels} from '../../../core/store/common/common.selectors';
import {isNullOrUndefined} from '../../utils/common.utils';

const allowAutomaticSubmission = true;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  public currentView$ = new BehaviorSubject<View>(null);
  public queryItems$ = new BehaviorSubject<QueryItem[]>([]);
  public form$ = new BehaviorSubject<FormGroup>(null);
  public queryItemsControl: FormArray;

  private subscriptions = new Subscription();

  private workspace: Workspace;
  private organization: Organization;
  private project: Project;
  private perspective: Perspective;
  private currentUser: User;
  private queryData: QueryData;

  constructor(private router: Router, private store$: Store<AppState>, private formBuilder: FormBuilder) {}

  public ngOnInit() {
    this.initForm();
    this.subscribeViewData();
    this.subscribeToQuery();
    this.subscribeToNavigation();
  }

  private subscribeViewData() {
    this.subscriptions.add(this.store$.pipe(select(selectCurrentUser)).subscribe(user => (this.currentUser = user)));
    this.subscriptions.add(this.store$.pipe(select(selectCurrentView)).subscribe(view => this.currentView$.next(view)));
  }

  private subscribeToQuery() {
    const querySubscription = this.store$
      .pipe(
        select(selectQuery),
        filter(query => !!query),
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
    const navigationSubscription = this.store$.pipe(select(selectNavigation)).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.perspective = navigation.perspective;
    });
    this.subscriptions.add(navigationSubscription);

    const workspaceSubscription = this.store$.pipe(select(selectWorkspaceModels)).subscribe(models => {
      this.organization = models.organization;
      this.project = models.project;
    });
    this.subscriptions.add(workspaceSubscription);
  }

  private loadData(): Observable<QueryData> {
    return observableCombineLatest(
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
      this.store$.pipe(select(selectCollectionsLoaded)),
      this.store$.pipe(select(selectLinkTypesLoaded))
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
      case QueryItemType.View:
        return this.addItemToEnd(queryItem);
    }
  }

  private addItemBeforeFulltexts(queryItem: QueryItem) {
    const queryItems = this.queryItems$.getValue();
    const fulltextIndex = queryItems.findIndex(qi => qi.type === QueryItemType.Fulltext);
    const insertIndex = fulltextIndex !== -1 ? fulltextIndex : queryItems.length;
    this.addQueryItemAtIndex(queryItem, insertIndex);
  }

  private addLinkItem(linkItem: LinkQueryItem) {
    const queryItems = this.queryItems$.getValue();
    let skipItems = false;
    for (let i = queryItems.length - 1; i >= 0; i--) {
      const queryItem = queryItems[i];
      if (queryItem.type === QueryItemType.Link && !skipItems) {
        const linkingCollectionId = this.getLinkingCollectionIdForLinkIndex(i);
        if (linkingCollectionId && linkItem.collectionIds.includes(linkingCollectionId)) {
          this.addQueryItemAtIndex(linkItem, i + 1);
          return;
        }
        skipItems = true;
      } else if (queryItem.type === QueryItemType.Collection) {
        if (!skipItems && linkItem.collectionIds.includes((queryItem as CollectionQueryItem).collection.id)) {
          this.addQueryItemAtIndex(linkItem, i + 1);
          return;
        }
        skipItems = false;
      }
    }

    const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(linkItem.collectionIds[0]);
    this.addItemBeforeFulltexts(collectionItem);
    this.addItemBeforeFulltexts(linkItem);
  }

  private getLinkingCollectionIdForLinkIndex(linkIndex: number): string {
    const stemData = this.getStemCollectionIdForLinkIndex(linkIndex);
    if (!stemData) {
      return null;
    }

    const {collectionId, index} = stemData;
    const queryItems = this.queryItems$.getValue();

    let linkingCollectionId = collectionId;
    for (let i = index + 1; i <= linkIndex; i++) {
      const linkItem = queryItems[i] as LinkQueryItem;
      const otherCollectionIds = getArrayDifference(linkItem.collectionIds, [linkingCollectionId]);
      if (otherCollectionIds.length !== 1) {
        return null;
      }
      linkingCollectionId = otherCollectionIds[0];
    }
    return linkingCollectionId;
  }

  private getStemCollectionIdForLinkIndex(index: number): {collectionId: string; index: number} {
    const queryItems = this.queryItems$.getValue();

    let collectionItemIndex = index;
    let currentItem: QueryItem = queryItems[index];
    while (currentItem.type === QueryItemType.Link) {
      collectionItemIndex--;
      currentItem = queryItems[collectionItemIndex];
    }

    if (collectionItemIndex < 0 || currentItem.type !== QueryItemType.Collection) {
      return null;
    }

    return {collectionId: (currentItem as CollectionQueryItem).collection.id, index: collectionItemIndex};
  }

  private addAttributeItem(attributeItem: AttributeQueryItem) {
    const queryStartData = this.findQueryStemStartIndexForCollection(attributeItem.collection.id);
    if (queryStartData) {
      const queryItems = this.queryItems$.getValue();
      const {index, distanceFromCollection} = queryStartData;
      for (let i = index + 1; i < queryItems.length; i++) {
        const queryItem = queryItems[i];
        if (queryItem.type === QueryItemType.Attribute) {
          const currentAttributeItem = queryItem as AttributeQueryItem;
          if (currentAttributeItem.collection.id !== attributeItem.collection.id) {
            const attributeStartData = this.findQueryStemStartIndexForCollection(currentAttributeItem.collection.id);
            if (distanceFromCollection < attributeStartData.distanceFromCollection) {
              // we found attributeItem which should be behind adding item
              this.addQueryItemAtIndex(attributeItem, i);
              return;
            }
          }
        } else if ([QueryItemType.Collection, QueryItemType.Document].includes(queryItem.type)) {
          // index is now at the end of attributes or at the start of another query stem
          this.addQueryItemAtIndex(attributeItem, i);
          return;
        }
      }

      this.addItemBeforeFulltexts(attributeItem);
    } else {
      const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(attributeItem.collection.id);
      this.addItemBeforeFulltexts(collectionItem);
      this.addItemBeforeFulltexts(attributeItem);
    }
  }

  private addDocumentItem(documentItem: DocumentQueryItem) {
    const queryStartData = this.findQueryStemStartIndexForCollection(documentItem.document.collectionId);
    if (queryStartData) {
      const queryItems = this.queryItems$.getValue();
      const {index, distanceFromCollection} = queryStartData;
      for (let i = index + 1; i < queryItems.length; i++) {
        const queryItem = queryItems[i];
        if (queryItem.type === QueryItemType.Document) {
          const currentDocumentItem = queryItem as DocumentQueryItem;
          if (currentDocumentItem.document.collectionId !== documentItem.document.collectionId) {
            const documentStartData = this.findQueryStemStartIndexForCollection(
              currentDocumentItem.document.collectionId
            );
            if (distanceFromCollection < documentStartData.distanceFromCollection) {
              // we found documentItem which should be behind adding item
              this.addQueryItemAtIndex(documentItem, i);
              return;
            }
          }
        } else if (queryItem.type === QueryItemType.Collection) {
          // index is now at the end of documents or at the start of another query stem
          this.addQueryItemAtIndex(documentItem, i);
          return;
        }
      }

      this.addItemBeforeFulltexts(documentItem);
    } else {
      const collectionItem = new QueryItemsConverter(this.queryData).createCollectionItem(
        documentItem.document.collectionId
      );
      this.addItemBeforeFulltexts(collectionItem);
      this.addItemBeforeFulltexts(documentItem);
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
      } else if (queryItem.type === QueryItemType.Collection) {
        if (properLinkIndex !== -1) {
          const distanceFromCollection = properLinkIndex - index;
          return {index, distanceFromCollection};
        } else if (collectionId === (queryItem as CollectionQueryItem).collection.id) {
          return {index, distanceFromCollection: 0};
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
    if (lastIndex >= 0) {
      this.onRemoveQueryItem(lastIndex);
    }
  }

  public onRemoveQueryItem(index: number) {
    if (this.shouldInvalidateQuery()) {
      this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: {}}));
    } else {
      this.removeQueryItemWithRelatedItems(index);
      this.onQueryItemsChanged();
    }
  }

  private shouldInvalidateQuery(): boolean {
    const currentView = this.currentView$.getValue();
    return (
      currentView &&
      !userHasManageRoleInResource(this.currentUser, currentView) &&
      !userIsManagerInWorkspace(this.currentUser, this.organization, this.project)
    );
  }

  private removeQueryItemWithRelatedItems(index: number) {
    const queryItem = this.queryItems$.getValue()[index];
    switch (queryItem.type) {
      case QueryItemType.Collection:
        return this.removeCollectionStem(queryItem as CollectionQueryItem);
      case QueryItemType.Link:
        return this.removeLinkChainFromStem(index);
      case QueryItemType.Attribute:
        return this.removeQueryItem(index);
      case QueryItemType.Document:
        return this.removeQueryItem(index);
      case QueryItemType.Fulltext:
        return this.removeQueryItem(index);
    }
  }

  private removeCollectionStem(item: CollectionQueryItem) {
    const collectionId = item.collection.id;
    const currentQuery = convertQueryItemsToQueryModel(this.queryItems$.getValue());

    const stems = (currentQuery.stems || []).filter(stem => stem.collectionId !== collectionId);
    this.setNewQueryItemsByQuery({...currentQuery, stems});
  }

  private setNewQueryItemsByQuery(query: Query) {
    const newQueryItems = new QueryItemsConverter(this.queryData).fromQuery(query);

    this.queryItems$.next(newQueryItems);
    this.initForm(newQueryItems);
  }

  private removeLinkChainFromStem(linkIndex: number) {
    const stemData = this.getStemCollectionIdForLinkIndex(linkIndex);
    if (!stemData) {
      return;
    }
    const {collectionId, index} = stemData;
    const currentQuery = convertQueryItemsToQueryModel(this.queryItems$.getValue());
    const stemIndex = (currentQuery.stems || []).findIndex(st => st.collectionId === collectionId);

    if (stemIndex !== -1) {
      currentQuery.stems[stemIndex] = filterStemByLinkIndex(
        currentQuery.stems[stemIndex],
        index,
        this.queryData.linkTypes
      );
      this.setNewQueryItemsByQuery(currentQuery);
    }
  }

  private removeQueryItem(index: number) {
    const queryItems = this.queryItems$.getValue().slice();
    queryItems.splice(index, 1);
    this.queryItems$.next(queryItems);
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

  private navigateToView(view: View) {
    this.router.navigate(['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}]);
  }

  private showByQueryItems(redirect?: boolean) {
    const query = convertQueryItemsToString(this.queryItems$.getValue());
    this.navigateToQuery(query, redirect);
  }

  private navigateToQuery(query: string, redirect?: boolean) {
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
      this.queryItemsControl = form.get('queryItems') as FormArray;
      this.form$.next(form);
    }
  }

  public trackByTypeAndText(index: number, queryItem: QueryItem) {
    return queryItem.type.toString() + queryItem.text;
  }
}
