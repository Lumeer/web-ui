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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  Renderer2,
  ElementRef,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {Query} from '../../../core/store/navigation/query/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
import {take, tap, withLatestFrom} from 'rxjs/operators';
import {selectKanbanById, selectKanbanConfig} from '../../../core/store/kanbans/kanban.state';
import {DEFAULT_KANBAN_ID, KanbanConfig} from '../../../core/store/kanbans/kanban';
import {View, ViewConfig} from '../../../core/store/views/view';
import {KanbansAction} from '../../../core/store/kanbans/kanbans.action';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {
  selectCollectionsByQuery,
  selectDocumentsAndLinksByQuery,
  selectLinkTypesByQuery,
} from '../../../core/store/common/permissions.selectors';
import {CollapsibleSidebarComponent} from '../../../shared/collapsible-sidebar/collapsible-sidebar.component';
import {KanbanColumnsComponent} from './columns/kanban-columns.component';
import {ViewsAction} from '../../../core/store/views/views.action';
import {checkOrTransformKanbanConfig, kanbanConfigIsEmpty} from './util/kanban.util';
import {ConstraintData} from '../../../core/model/data/constraint';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  templateUrl: './kanban-perspective.component.html',
  styleUrls: ['./kanban-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanPerspectiveComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CollapsibleSidebarComponent, {read: ElementRef, static: false})
  public sidebarComponent: ElementRef;

  @ViewChild(KanbanColumnsComponent, {read: ElementRef, static: false})
  set content(content: ElementRef) {
    this.kanbanColumnsComponent = content;
    this.computeKanbansWidth();
  }

  private kanbanColumnsComponent: ElementRef;

  public config$: Observable<KanbanConfig>;
  public currentView$: Observable<View>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public linkTypes$: Observable<LinkType[]>;
  public collections$: Observable<Collection[]>;
  public query$: Observable<Query>;
  public constraintData$: Observable<ConstraintData>;
  public workspace$: Observable<Workspace>;

  public sidebarOpened$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();
  private kanbanId = DEFAULT_KANBAN_ID;

  constructor(private store$: Store<AppState>, private renderer: Renderer2) {}

  public ngOnInit() {
    this.initKanban();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    this.query$ = this.store$.pipe(
      select(selectQuery),
      tap(query => this.fetchData(query))
    );
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeData() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesByQuery));
    this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByQuery));
    this.config$ = this.store$.pipe(select(selectKanbanConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
  }

  private initKanban() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectKanbanById(this.kanbanId)))),
        withLatestFrom(this.store$.pipe(select(selectSidebarOpened)))
      )
      .subscribe(([[view, kanban], sidebarOpened]) => {
        if (kanban) {
          this.refreshKanban(view && view.config);
        } else {
          this.createKanban(view, sidebarOpened);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshKanban(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.kanban) {
      this.store$.dispatch(new KanbansAction.SetConfig({kanbanId: this.kanbanId, config: viewConfig.kanban}));
    }
  }

  private createKanban(view: View, sidebarOpened: boolean) {
    combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesByQuery)),
    ])
      .pipe(take(1))
      .subscribe(([query, collections, linkTypes]) => {
        const config = checkOrTransformKanbanConfig(
          view && view.config && view.config.kanban,
          query,
          collections,
          linkTypes
        );
        const kanban = {id: this.kanbanId, config};
        this.store$.dispatch(new KanbansAction.AddKanban({kanban}));
        this.setupSidebar(view, config, sidebarOpened);
      });
  }

  private setupSidebar(view: View, config: KanbanConfig, opened: boolean) {
    if (!view || kanbanConfigIsEmpty(config)) {
      this.sidebarOpened$.next(true);
    } else {
      this.sidebarOpened$.next(opened);
    }
  }

  public ngAfterViewInit() {
    this.computeKanbansWidth();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new KanbansAction.RemoveKanban({kanbanId: this.kanbanId}));
  }

  public onConfigChanged(config: KanbanConfig) {
    this.store$.dispatch(new KanbansAction.SetConfig({kanbanId: this.kanbanId, config}));
  }

  public onSidebarToggle() {
    setTimeout(() => this.computeKanbansWidth());

    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  private computeKanbansWidth() {
    if (this.kanbanColumnsComponent) {
      const sidebarWidth = (this.sidebarComponent && this.sidebarComponent.nativeElement.offsetWidth) || 0;
      this.renderer.setStyle(this.kanbanColumnsComponent.nativeElement, 'width', `calc(100% - ${sidebarWidth}px)`);
    }
  }

  public onPatchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }
}
