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

import {Component, OnInit, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {View} from '../../../core/store/views/view';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Collection} from '../../../core/store/collections/collection';
import {Query} from '../../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {
  distinctUntilChanged,
  map,
  mergeMap,
  pairwise,
  startWith,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';
import {
  selectCanManageViewConfig,
  selectCurrentView,
  selectSidebarOpened,
  selectViewQuery
} from '../../../core/store/views/views.state';
import {selectPivotById, selectPivotConfig, selectPivotId} from '../../../core/store/pivots/pivots.state';
import {DEFAULT_PIVOT_ID, PivotConfig} from '../../../core/store/pivots/pivot';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {PivotsAction} from '../../../core/store/pivots/pivots.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {ViewsAction} from '../../../core/store/views/views.action';
import {checkOrTransformPivotConfig} from './util/pivot-util';
import {ConstraintData} from '../../../core/model/data/constraint';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {selectCurrentQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectCurrentQueryLinkInstancesLoaded} from '../../../core/store/link-instances/link-instances.state';
import {StoreDataService} from '../../../core/service/store-data.service';

@Component({
  selector: 'pivot-perspective',
  templateUrl: './pivot-perspective.component.html',
  styleUrls: ['./pivot-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotPerspectiveComponent implements OnInit, OnDestroy {
  public config$: Observable<PivotConfig>;
  public canManageConfig$: Observable<boolean>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public dataLoaded$: Observable<boolean>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public query$ = new BehaviorSubject<Query>(null);
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private storeDataService: StoreDataService) {}

  public ngOnInit() {
    this.initPivot();
    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  private initPivot() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({pivotId, config}: {pivotId?: string; config?: PivotConfig}) => {
        if (pivotId) {
          this.store$.dispatch(new PivotsAction.AddPivot({pivot: {id: pivotId, config}}));
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{pivotId?: string; config?: PivotConfig}> {
    const pivotId = view.code;
    return this.store$.pipe(
      select(selectPivotById(pivotId)),
      take(1),
      mergeMap(pivotEntity => {
        const pivotConfig = view.config && view.config.pivot;
        if (preferViewConfigUpdate(previousView?.config?.pivot, view?.config?.pivot, !!pivotEntity)) {
          return this.checkPivotConfig(pivotConfig).pipe(map(config => ({pivotId, config})));
        }
        return of({pivotId, config: (pivotEntity && pivotEntity.config) || pivotConfig});
      })
    );
  }

  private checkPivotConfig(config: PivotConfig): Observable<PivotConfig> {
    return combineLatest([
      this.store$.pipe(select(selectViewQuery)),
      this.storeDataService.selectCollectionsByQuery$(),
      this.storeDataService.selectLinkTypesInQuery$(),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformPivotConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{pivotId?: string; config?: PivotConfig}> {
    const pivotId = DEFAULT_PIVOT_ID;
    return this.store$.pipe(
      select(selectViewQuery),
      withLatestFrom(this.store$.pipe(select(selectPivotById(pivotId)))),
      mergeMap(([, pivot]) => this.checkPivotConfig(pivot && pivot.config)),
      map(config => ({pivotId, config}))
    );
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectViewQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchData(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeData() {
    this.config$ = this.store$.pipe(select(selectPivotConfig));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.collections$ = this.storeDataService.selectCollectionsByQuery$();
    this.linkTypes$ =this.storeDataService.selectLinkTypesInQuery$();
    this.documentsAndLinks$ = this.storeDataService.selectDocumentsAndLinksByQuerySorted$();
    this.dataLoaded$ = combineLatest([
      this.store$.pipe(select(selectCurrentQueryDocumentsLoaded)),
      this.store$.pipe(select(selectCurrentQueryLinkInstancesLoaded)),
    ]).pipe(
      map(loaded => loaded.every(load => load)),
      distinctUntilChanged()
    );
  }

  public onConfigChange(config: PivotConfig) {
    this.store$
      .pipe(select(selectPivotId), take(1))
      .subscribe(pivotId => this.store$.dispatch(new PivotsAction.SetConfig({pivotId, config})));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  private setupSidebar() {
    this.store$
      .pipe(select(selectCurrentView), withLatestFrom(this.store$.pipe(select(selectSidebarOpened))), take(1))
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }
}
