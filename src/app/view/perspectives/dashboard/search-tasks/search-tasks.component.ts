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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {
  selectTasksCollectionsByCustomQuery,
  selectTasksDocumentsByCustomQuery,
} from '../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../core/store/navigation/query/query';
import {SearchConfig, SearchDocumentsConfig} from '../../../../core/store/searches/search';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectSearchConfigById} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../perspective';
import {selectAllViews, selectViewQuery} from '../../../../core/store/views/views.state';
import {ConstraintData} from '@lumeer/data-filters';
import {DataResourcesAction} from '../../../../core/store/data-resources/data-resources.action';
import {selectQueryTasksLoaded} from '../../../../core/store/data-resources/data-resources.state';
import {selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {View} from '../../../../core/store/views/view';
import {User} from '../../../../core/store/users/user';
import {defaultSearchPerspectiveConfiguration, SearchPerspectiveConfiguration} from '../../perspective-configuration';

const PAGE_SIZE = 50;

@Component({
  selector: 'search-tasks',
  templateUrl: './search-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTasksComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public view: View;

  @Input()
  public maxLines: number = -1;

  @Input()
  public perspectiveConfiguration: SearchPerspectiveConfiguration = defaultSearchPerspectiveConfiguration;

  @Input()
  public compactEmptyPages: boolean;

  @Input()
  public scrollContainer: string;

  public constraintData$: Observable<ConstraintData>;
  public documentsConfig$: Observable<SearchDocumentsConfig>;
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public loaded$: Observable<boolean>;
  public searchId$: Observable<string>;
  public query$: Observable<Query>;
  public views$: Observable<View[]>;
  public workspace$: Observable<Workspace>;
  public currentUser$: Observable<User>;

  private isEmbedded: boolean;
  private searchId: string;
  private config: SearchConfig;
  private subscriptions = new Subscription();
  private page$ = new BehaviorSubject<number>(0);
  private overrideView$ = new BehaviorSubject<View>(null);

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
    this.isEmbedded = !!this.view;
  }

  public ngOnInit() {
    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      })
    );
    this.searchId$ = this.overrideView$.pipe(
      map(view => {
        if (view) {
          return view.code;
        }
        return DEFAULT_PERSPECTIVE_ID;
      })
    );

    this.collections$ = this.query$.pipe(
      switchMap(query => this.store$.pipe(select(selectTasksCollectionsByCustomQuery(query))))
    );
    this.loaded$ = this.query$.pipe(switchMap(query => this.store$.pipe(select(selectQueryTasksLoaded(query)))));

    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.documentsConfig$ = this.selectDocumentsConfig$();
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.views$ = this.store$.pipe(select(selectAllViews));
    this.documents$ = this.subscribeDocuments$();

    this.subscribeSearchId();
    this.subscribeQueryChange();
  }

  private subscribeSearchId() {
    this.subscriptions.add(this.searchId$.subscribe(searchId => (this.searchId = searchId)));
  }

  private selectDocumentsConfig$(): Observable<SearchDocumentsConfig> {
    return this.searchId$.pipe(
      switchMap(id =>
        this.store$.pipe(
          select(selectSearchConfigById(id)),
          tap(config => (this.config = config)),
          map(config => config?.documents)
        )
      )
    );
  }

  private subscribeDocuments$(): Observable<DocumentModel[]> {
    const pageObservable = this.page$.asObservable();
    return this.query$.pipe(
      switchMap(query =>
        this.store$.pipe(
          select(selectTasksDocumentsByCustomQuery(query)),
          switchMap(documents => pageObservable.pipe(map(page => (documents || []).slice(0, PAGE_SIZE * (page + 1)))))
        )
      )
    );
  }

  public configChange(documentsConfig: SearchDocumentsConfig) {
    if (this.searchId) {
      const searchConfig = {...this.config, documents: documentsConfig};
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config: searchConfig}));
      if (this.searchId === DEFAULT_PERSPECTIVE_ID) {
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfig({
            model: {
              key: DEFAULT_PERSPECTIVE_ID,
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
    this.query$.pipe(take(1)).subscribe(query => {
      this.fetchTasks(query);
    });
  }

  private fetchTasks(query: Query) {
    this.store$.dispatch(new DataResourcesAction.GetTasks({query}));
  }

  private subscribeQueryChange() {
    const workspace$ = this.store$.pipe(select(selectWorkspace), distinctUntilChanged());

    const navigationSubscription = workspace$
      .pipe(
        switchMap(() => this.query$),
        filter(query => !!query)
      )
      .subscribe(query => {
        this.resetPage();
        this.fetchTasks(query);
      });
    this.subscriptions.add(navigationSubscription);
  }

  private resetPage() {
    this.page$.next(0);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
