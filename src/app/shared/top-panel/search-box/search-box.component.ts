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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';

import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ViewQueryItem} from './query-item/model/view.query-item';
import {debounceTime, filter, map, skip, startWith, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectCollectionsLoaded} from '../../../core/store/collections/collections.state';
import {selectLinkTypesLoaded} from '../../../core/store/link-types/link-types.state';
import {selectNavigation, selectPerspective, selectRawQuery} from '../../../core/store/navigation/navigation.state';
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
import {isQueryItemEditable, queryItemToForm} from '../../../core/store/navigation/query/query.util';
import {selectAllUsers, selectCurrentUser} from '../../../core/store/users/users.state';
import {User, UserHintsKeys} from '../../../core/store/users/user';
import {selectCurrentView, selectViewQuery} from '../../../core/store/views/views.state';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {selectWorkspaceModels} from '../../../core/store/common/common.selectors';
import {isNullOrUndefined} from '../../utils/common.utils';
import {
  addQueryItemWithRelatedItems,
  findQueryStemIdByIndex,
  removeQueryItemWithRelatedItems,
} from './util/search-box.util';
import {areQueriesEqual} from '../../../core/store/navigation/query/query.helper';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {Query} from '../../../core/store/navigation/query/query';
import {
  selectAllCollectionsWithoutHiddenAttributes,
  selectAllLinkTypesWithoutHiddenAttributes,
  selectCanChangeViewQuery,
  selectCanManageCurrentViewConfig,
} from '../../../core/store/common/permissions.selectors';
import {ConstraintData} from '@lumeer/data-filters';
import {SearchBoxData, SearchBoxService} from './util/search-box.service';
import {UsersAction} from '../../../core/store/users/users.action';

const ALLOW_AUTOMATIC_SUBMISSION = true;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  public currentView$ = new BehaviorSubject<View>(null);
  public queryItems$ = new BehaviorSubject<QueryItem[]>([]);
  public form$ = new BehaviorSubject<FormGroup>(null);

  public users$: Observable<User[]>;
  public constraintData$: Observable<ConstraintData>;
  public perspective$: Observable<Perspective>;
  public query$: Observable<Query>;
  public canManageConfig$: Observable<boolean>;
  public canChangeQuery$: Observable<boolean>;
  public searchBoxData$: Observable<SearchBoxData>;

  public displaySearchHint$: Observable<boolean>;

  public queryItemsControl: FormArray;

  private subscriptions = new Subscription();

  private workspace: Workspace;
  private organization: Organization;
  private project: Project;
  private perspective: Perspective;
  private queryData: QueryData;
  private searchBoxService: SearchBoxService;

  constructor(private router: Router, private store$: Store<AppState>, private formBuilder: FormBuilder) {
    const queryItemsObservable$ = this.queryItems$.pipe(skip(1));
    this.searchBoxService = new SearchBoxService(store$, queryItemsObservable$);
  }

  public ngOnInit() {
    this.initForm();
    this.subscribeViewData();
    this.subscribeToQuery();
    this.subscribeToNavigation();
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.perspective$ = this.store$.pipe(select(selectPerspective));
    this.canChangeQuery$ = this.store$.pipe(select(selectCanChangeViewQuery));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageCurrentViewConfig));
    this.searchBoxData$ = this.searchBoxService.data$;

    this.displaySearchHint$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => !user.hints?.searchHintDismissed)
    );
  }

  private subscribeViewData() {
    this.subscriptions.add(this.store$.pipe(select(selectCurrentView)).subscribe(view => this.currentView$.next(view)));
  }

  private subscribeToQuery() {
    const querySubscription = combineLatest([this.store$.pipe(select(selectRawQuery)), this.subscribeData$()])
      .pipe(
        debounceTime(100),
        withLatestFrom(this.router.events.pipe(startWith(null))),
        map(([[query, data], event]) => ({query, data, event})),
        filter(({query, event}) => !!query && (!event || event instanceof NavigationEnd)),
        tap(({data}) => (this.queryData = data)),
        map(({query, data}) => ({queryItems: new QueryItemsConverter(data).fromQuery(query, true), query}))
      )
      .subscribe(({queryItems, query}) => {
        if (this.itemsChanged(queryItems)) {
          this.initForm(queryItems);

          const newQuery = convertQueryItemsToQueryModel(queryItems);
          if (!areQueriesEqual(query, newQuery)) {
            this.store$.dispatch(new NavigationAction.SetQuery({query: newQuery}));
          }
        }
        this.queryItems$.next(queryItems);
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

  private subscribeData$(): Observable<QueryData> {
    return combineLatest([
      this.store$.pipe(select(selectAllCollectionsWithoutHiddenAttributes)),
      this.store$.pipe(select(selectAllLinkTypesWithoutHiddenAttributes)),
      this.store$.pipe(select(selectCollectionsLoaded)),
      this.store$.pipe(select(selectLinkTypesLoaded)),
    ]).pipe(
      debounceTime(100),
      filter(([, , collectionsLoaded, linkTypesLoaded]) => collectionsLoaded && linkTypesLoaded),
      map(([collections, linkTypes]) => ({
        collections: collections.filter(collection => !!collection?.id),
        linkTypes: linkTypes.filter(linkType => !!linkType?.id),
      }))
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onHintDismissed() {
    this.store$.dispatch(new UsersAction.SetHint({hint: UserHintsKeys.searchHintDismissed, value: true}));
  }

  public onToggleExpandStem(stemId: string) {
    this.searchBoxService.toggleExpand(stemId);
  }

  public onAddQueryItem(queryItem: QueryItem) {
    const {stemIndex, items: newQueryItems} = addQueryItemWithRelatedItems(
      this.queryData,
      this.queryItems$.getValue(),
      queryItem
    );
    this.expandStemByStemIndex(stemIndex);
    this.afterAddedQueryItem(newQueryItems);
  }

  public onAddQueryItemToStem(queryItem: QueryItem, stemIndex: number, stemId: string) {
    const newQueryItems = addQueryItemWithRelatedItems(
      this.queryData,
      this.queryItems$.getValue(),
      queryItem,
      stemIndex
    ).items;
    this.searchBoxService.expand(stemId);
    this.afterAddedQueryItem(newQueryItems);
  }

  private expandStemByStemIndex(stemIndex: number) {
    const stemId = findQueryStemIdByIndex(this.queryItems$.value, stemIndex);
    if (stemId) {
      this.searchBoxService.expand(stemId);
    }
  }

  private afterAddedQueryItem(newQueryItems: QueryItem[]) {
    if (!this.showView(newQueryItems)) {
      this.queryItems$.next(newQueryItems);
      this.initForm(newQueryItems);
      this.onQueryItemsChanged();
    }
  }

  public onStemTextChanged(data: {text: string; stemId: string}) {
    this.searchBoxService.changeText(data.stemId, data.text);
  }

  public onRemoveLastQueryItem(canManageConfig: boolean) {
    const lastIndex = this.queryItems$.value.length - 1;
    if (lastIndex >= 0) {
      if (isQueryItemEditable(lastIndex, this.queryItems$.value, canManageConfig, this.currentView$.value?.query)) {
        this.onRemoveQueryItem(lastIndex);
      }
    }
  }

  public onRemoveQueryItem(index: number) {
    this.removeQueryItemWithRelatedItems(index);
    this.onQueryItemsChanged();
  }

  private removeQueryItemWithRelatedItems(index: number) {
    const newQueryItems = removeQueryItemWithRelatedItems(this.queryData, this.queryItems$.getValue(), index);
    this.queryItems$.next(newQueryItems);
    this.initForm(newQueryItems);
  }

  public onQueryItemsChanged() {
    if (ALLOW_AUTOMATIC_SUBMISSION && this.form$.getValue().valid) {
      this.onSearch();
    }
  }

  public onSearch(redirect?: boolean) {
    if (!this.form$.getValue().valid) {
      return;
    }

    if (this.showView(this.queryItems$.value)) {
      return;
    }

    this.showByQueryItems(redirect);
  }

  private showView(queryItems: QueryItem[]): boolean {
    const viewQueryItem = (queryItems || []).find(item => item.type === QueryItemType.View) as ViewQueryItem;

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
    const searchUrl = ['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', Perspective.Search];
    const url = redirect || !this.perspective ? searchUrl : [];
    this.router.navigate(url, {queryParams: {q: query}, queryParamsHandling: 'merge'});
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

  public trackByQueryItem(index: number, data: {queryItem: QueryItem}) {
    return `${data.queryItem.stemId || ''}:${data.queryItem.type}:${data.queryItem.text}`;
  }
}
