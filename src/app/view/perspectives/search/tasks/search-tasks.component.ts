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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, pairwise, startWith, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {
  selectTasksCollectionsByQuery,
  selectTasksDocumentsByQuery,
} from '../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../core/store/navigation/query/query';
import {DEFAULT_SEARCH_ID, SearchConfig, SearchDocumentsConfig} from '../../../../core/store/searches/search';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectSearchConfig, selectSearchId} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {sortDocumentsTasks} from '../../../../core/store/documents/document.utils';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {queryWithoutFilters} from '../../../../core/store/navigation/query/query.util';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {Perspective} from '../../perspective';
import {selectViewQuery} from '../../../../core/store/views/views.state';
import {ConstraintData} from '@lumeer/data-filters';
import {DataResourcesAction} from '../../../../core/store/data-resources/data-resources.action';
import {selectCurrentQueryTasksLoaded} from '../../../../core/store/data-resources/data-resources.state';

const PAGE_SIZE = 40;

@Component({
  selector: 'search-tasks',
  templateUrl: './search-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTasksComponent implements OnInit, OnDestroy {
  @Input()
  public maxLines: number = -1;

  public constraintData$: Observable<ConstraintData>;
  public documentsConfig$: Observable<SearchDocumentsConfig>;
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public loaded$: Observable<boolean>;
  public query$: Observable<Query>;
  public workspace$: Observable<Workspace>;

  private searchId: string;
  private config: SearchConfig;
  private documentsOrder = [];
  private subscriptions = new Subscription();
  private page$ = new BehaviorSubject<number>(0);

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectTasksCollectionsByQuery));
    this.loaded$ = this.store$.pipe(select(selectCurrentQueryTasksLoaded));
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.documentsConfig$ = this.selectDocumentsConfig$();
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.documents$ = this.subscribeDocuments$();

    this.subscribeSearchId();
    this.subscribeQueryChange();
  }

  private subscribeSearchId() {
    this.store$.pipe(select(selectSearchId), take(1)).subscribe(searchId => (this.searchId = searchId));
  }

  private selectDocumentsConfig$(): Observable<SearchDocumentsConfig> {
    return this.store$.pipe(
      select(selectSearchConfig),
      tap(config => (this.config = config)),
      map(config => config?.documents)
    );
  }

  private subscribeDocuments$(): Observable<DocumentModel[]> {
    const pageObservable = this.page$.asObservable();
    return this.store$.pipe(
      select(selectTasksDocumentsByQuery),
      switchMap(documents => this.collections$.pipe(map(collections => sortDocumentsTasks(documents, collections)))),
      switchMap(documents => pageObservable.pipe(map(page => (documents || []).slice(0, PAGE_SIZE * (page + 1)))))
    );
  }

  public configChange(documentsConfig: SearchDocumentsConfig) {
    if (this.searchId) {
      const searchConfig = {...this.config, documents: documentsConfig};
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config: searchConfig}));
      if (this.searchId === DEFAULT_SEARCH_ID) {
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfig({
            model: {
              key: DEFAULT_SEARCH_ID,
              perspective: Perspective.Search,
              config: {search: searchConfig},
            },
          })
        );
      }
    }
  }

  public onFetchNextPage() {
    this.page$.next(this.page$.value + 1);
    this.store$.pipe(select(selectViewQuery), take(1)).subscribe(query => {
      this.fetchTasks(query);
    });
  }

  private fetchTasks(query: Query) {
    this.store$.dispatch(new DataResourcesAction.GetTasks({query}));
  }

  private subscribeQueryChange() {
    const navigationSubscription = this.store$
      .pipe(
        select(selectViewQuery),
        filter(query => !!query),
        distinctUntilChanged((a, b) => deepObjectsEquals(a, b)),
        startWith(null as Query),
        pairwise()
      )
      .subscribe(([previousQuery, query]) => {
        const queryChangedWithoutFilters = !deepObjectsEquals(
          queryWithoutFilters(previousQuery),
          queryWithoutFilters(query)
        );
        if (queryChangedWithoutFilters) {
          this.resetDocumentsOrder();
        }
        this.resetPage();
        this.fetchTasks(query);
      });
    this.subscriptions.add(navigationSubscription);
  }

  private resetPage() {
    this.page$.next(0);
  }

  private resetDocumentsOrder() {
    this.documentsOrder = [];
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
