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
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {
  selectCollectionsByCustomViewAndQuery,
  selectTasksCollections,
  selectTasksDocumentsByCustomQuery,
  selectViewsByCustomQuery,
} from '../../../../core/store/common/permissions.selectors';
import {selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {
  selectAllViews,
  selectCurrentView,
  selectViewQuery,
  selectViewsLoaded,
} from '../../../../core/store/views/views.state';
import {Query} from '../../../../core/store/navigation/query/query';
import {DataResourcesAction} from '../../../../core/store/data-resources/data-resources.action';
import {selectQueryTasksLoaded} from '../../../../core/store/data-resources/data-resources.state';
import {queryIsEmpty} from '../../../../core/store/navigation/query/query.util';
import {View} from '../../../../core/store/views/view';
import {defaultSearchPerspectiveConfiguration, SearchPerspectiveConfiguration} from '../../perspective-configuration';
import {DocumentModel} from '../../../../core/store/documents/document.model';

@Component({
  selector: 'search-all',
  templateUrl: './search-all.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAllComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public view: View;

  @Input()
  public perspectiveConfiguration: SearchPerspectiveConfiguration = defaultSearchPerspectiveConfiguration;

  public dataLoaded$: Observable<boolean>;
  public hasCollection$: Observable<boolean>;
  public hasTaskCollection$: Observable<boolean>;
  public showTaskTab$: Observable<boolean>;
  public hasView$: Observable<boolean>;
  public hasAnyView$: Observable<boolean>;
  public query$: Observable<Query>;
  public view$: Observable<View>;

  private subscriptions = new Subscription();
  private overrideView$ = new BehaviorSubject<View>(null);

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
  }

  public ngOnInit() {
    this.subscribeDataInfo();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeDataInfo() {
    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      })
    );
    this.view$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view);
        }
        return this.store$.pipe(select(selectCurrentView));
      })
    );
    this.dataLoaded$ = combineLatest([
      this.store$.pipe(select(selectCollectionsLoaded)),
      this.store$.pipe(select(selectViewsLoaded)),
      this.query$.pipe(switchMap(query => this.store$.pipe(select(selectQueryTasksLoaded(query))))),
    ]).pipe(map(([collectionsLoaded, viewLoaded, tasksLoaded]) => collectionsLoaded && viewLoaded && tasksLoaded));

    const workspace$ = this.store$.pipe(select(selectWorkspace), distinctUntilChanged());

    const navigationSubscription = workspace$
      .pipe(
        switchMap(() => this.query$),
        filter(query => !!query)
      )
      .subscribe(query => this.fetchDocuments(query));
    this.subscriptions.add(navigationSubscription);

    this.hasCollection$ = combineLatest([this.view$, this.query$]).pipe(
      switchMap(([view, query]) => this.store$.pipe(select(selectCollectionsByCustomViewAndQuery(view, query)))),
      map(collections => collections?.length > 0)
    );

    this.hasView$ = this.query$.pipe(
      switchMap(query => this.store$.pipe(select(selectViewsByCustomQuery(query)))),
      map(views => views?.length > 0)
    );

    this.hasAnyView$ = this.store$.pipe(
      select(selectAllViews),
      map(views => views?.length > 0)
    );

    this.hasTaskCollection$ = this.store$.pipe(
      select(selectTasksCollections),
      map(collections => collections?.length > 0)
    );

    this.showTaskTab$ = combineLatest([this.hasTaskCollection$, this.subscribeDocuments$(), this.query$]).pipe(
      map(
        ([hasTaskCollection, documents, query]) => hasTaskCollection && (documents?.length > 0 || queryIsEmpty(query))
      )
    );
  }

  private subscribeDocuments$(): Observable<DocumentModel[]> {
    return combineLatest([this.view$, this.query$]).pipe(
      switchMap(([view, query]) => this.store$.pipe(select(selectTasksDocumentsByCustomQuery(view, query))))
    );
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DataResourcesAction.GetTasks({query}));
  }
}
