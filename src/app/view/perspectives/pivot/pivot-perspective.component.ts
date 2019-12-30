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
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {View, ViewConfig} from '../../../core/store/views/view';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Collection} from '../../../core/store/collections/collection';
import {Query} from '../../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {take, withLatestFrom} from 'rxjs/operators';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
import {selectPivotById, selectPivotConfig} from '../../../core/store/pivots/pivots.state';
import {DEFAULT_PIVOT_ID, PivotConfig} from '../../../core/store/pivots/pivot';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {
  selectCollectionsByQuery,
  selectDocumentsAndLinksByQuery,
  selectLinkTypesByQuery,
} from '../../../core/store/common/permissions.selectors';
import {PivotsAction} from '../../../core/store/pivots/pivots.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {ViewsAction} from '../../../core/store/views/views.action';
import {checkOrTransformPivotConfig, pivotConfigIsEmpty} from './util/pivot-util';
import {ConstraintData} from '../../../core/model/data/constraint';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'pivot-perspective',
  templateUrl: './pivot-perspective.component.html',
  styleUrls: ['./pivot-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotPerspectiveComponent implements OnInit, OnDestroy {
  public config$: Observable<PivotConfig>;
  public currentView$: Observable<View>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public query$ = new BehaviorSubject<Query>(null);
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();
  private pivotId = DEFAULT_PIVOT_ID;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initPivot();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private initPivot() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectPivotById(this.pivotId)))),
        withLatestFrom(this.store$.pipe(select(selectSidebarOpened)))
      )
      .subscribe(([[view, pivot], sidebarOpened]) => {
        if (pivot) {
          this.refreshPivot(view && view.config);
        } else {
          this.createPivot(view, sidebarOpened);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshPivot(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.pivot) {
      this.store$.dispatch(new PivotsAction.SetConfig({pivotId: this.pivotId, config: viewConfig.pivot}));
    }
  }

  private createPivot(view: View, sidebarOpened: boolean) {
    combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesByQuery)),
    ])
      .pipe(take(1))
      .subscribe(([query, collections, linkTypes]) => {
        const config = checkOrTransformPivotConfig(
          view && view.config && view.config.pivot,
          query,
          collections,
          linkTypes
        );
        const pivot = {id: this.pivotId, config};
        this.store$.dispatch(new PivotsAction.AddPivot({pivot}));
        this.setupSidebar(view, config, sidebarOpened);
      });
  }

  private setupSidebar(view: View, config: PivotConfig, opened: boolean) {
    if (!view || pivotConfigIsEmpty(config)) {
      this.sidebarOpened$.next(true);
    } else {
      this.sidebarOpened$.next(opened);
    }
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
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
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByQuery));
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesByQuery));
  }

  public onConfigChange(config: PivotConfig) {
    this.store$.dispatch(new PivotsAction.SetConfig({pivotId: this.pivotId, config}));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new PivotsAction.RemovePivot({pivotId: this.pivotId}));
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }
}
