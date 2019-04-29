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
import {NavigationEnd, Router} from '@angular/router';

import {BehaviorSubject, combineLatest, combineLatest as observableCombineLatest, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ViewQueryItem} from './query-item/model/view.query-item';
import {debounceTime, filter, map, startWith, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectAllCollections, selectCollectionsLoaded} from '../../../core/store/collections/collections.state';
import {selectAllLinkTypes, selectLinkTypesLoaded} from '../../../core/store/link-types/link-types.state';
import {selectNavigation, selectQuery} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {View} from '../../../core/store/views/view';
import {Perspective} from '../../../view/perspectives/perspective';
import {QueryData} from './util/query-data';
import {QueryItem} from './query-item/model/query-item';
import {QueryItemType} from './query-item/model/query-item-type';
import {
  convertQueryItemsToQueryModel,
  convertQueryItemsToString,
  QueryItemsConverter,
} from './query-item/query-items.converter';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {queryItemToForm} from '../../../core/store/navigation/query.util';
import {selectAllUsers, selectCurrentUser} from '../../../core/store/users/users.state';
import {User} from '../../../core/store/users/user';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {userHasManageRoleInResource, userIsManagerInWorkspace} from '../../utils/resource.utils';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {selectWorkspaceModels} from '../../../core/store/common/common.selectors';
import {isNullOrUndefined} from '../../utils/common.utils';
import {addQueryItemWithRelatedItems, removeQueryItemWithRelatedItems} from './util/search-box.util';
import {areQueriesEqual} from '../../../core/store/navigation/query.helper';

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

  public users$: Observable<User[]>;

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
    this.users$ = this.store$.pipe(select(selectAllUsers));
  }

  private subscribeViewData() {
    this.subscriptions.add(this.store$.pipe(select(selectCurrentUser)).subscribe(user => (this.currentUser = user)));
    this.subscriptions.add(this.store$.pipe(select(selectCurrentView)).subscribe(view => this.currentView$.next(view)));
  }

  private subscribeToQuery() {
    const querySubscription = combineLatest(this.store$.pipe(select(selectQuery)), this.loadData())
      .pipe(
        debounceTime(100),
        withLatestFrom(this.router.events.pipe(startWith(null))),
        map(([[query, data], event]) => ({query, data, event})),
        filter(({query, event}) => !!query && (!event || event instanceof NavigationEnd)),
        tap(({data}) => (this.queryData = data)),
        map(({query, data}) => ({queryItems: new QueryItemsConverter(data).fromQuery(query, true), query})),
        filter(({queryItems}) => this.itemsChanged(queryItems))
      )
      .subscribe(({queryItems, query}) => {
        this.queryItems$.next(queryItems);
        this.initForm(queryItems);

        const newQuery = convertQueryItemsToQueryModel(queryItems);
        if (!areQueriesEqual(query, newQuery)) {
          this.store$.dispatch(new NavigationAction.SetQuery({query: newQuery}));
        }
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
      debounceTime(100),
      filter(([, , collectionsLoaded, linkTypesLoaded]) => collectionsLoaded && linkTypesLoaded),
      map(([collections, linkTypes]) => ({
        collections: collections.filter(collection => collection && collection.id),
        linkTypes: linkTypes.filter(linkType => linkType && linkType.id),
      }))
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
    const newQueryItems = addQueryItemWithRelatedItems(this.queryData, this.queryItems$.getValue(), queryItem);
    this.queryItems$.next(newQueryItems);
    this.initForm(newQueryItems);
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
    const newQueryItems = removeQueryItemWithRelatedItems(this.queryData, this.queryItems$.getValue(), index);
    this.queryItems$.next(newQueryItems);
    this.initForm(newQueryItems);
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
      if (currentQueryItems[i].value !== queryItems[i].value) {
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
