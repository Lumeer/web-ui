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
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Query} from '../../../core/store/navigation/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
import {map, withLatestFrom} from 'rxjs/operators';
import {selectKanbanById, selectKanbanConfig} from '../../../core/store/kanbans/kanban.state';
import {DEFAULT_KANBAN_ID, KanbanConfig} from '../../../core/store/kanbans/kanban';
import {View, ViewConfig} from '../../../core/store/views/view';
import {KanbansAction} from '../../../core/store/kanbans/kanbans.action';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {
  selectCollectionsByCustomQuery,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {queryWithoutLinks} from '../../../core/store/navigation/query.util';
import {CollapsibleSidebarComponent} from '../../../shared/collapsible-sidebar/collapsible-sidebar.component';
import {KanbanColumnsComponent} from './columns/kanban-columns.component';
import {User} from '../../../core/store/users/user';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {ViewsAction} from '../../../core/store/views/views.action';

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
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public query$ = new BehaviorSubject<Query>(null);
  public users$: Observable<User[]>;

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
    const subscription = this.store$
      .pipe(
        select(selectQuery),
        map(query => query && queryWithoutLinks(query))
      )
      .subscribe(query => {
        this.query$.next(query);
        this.fetchData(query);
        this.subscribeDataByQuery(query);
      });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private subscribeDataByQuery(query: Query) {
    this.documents$ = this.store$.pipe(select(selectDocumentsByCustomQuery(query)));
    this.collections$ = this.store$.pipe(select(selectCollectionsByCustomQuery(query)));
  }

  private subscribeData() {
    this.config$ = this.store$.pipe(select(selectKanbanConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.users$ = this.store$.pipe(select(selectAllUsers));
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
          this.createKanban(view && view.config);
          this.setupSidebar(view, sidebarOpened);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshKanban(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.kanban) {
      this.store$.dispatch(new KanbansAction.SetConfig({kanbanId: this.kanbanId, config: viewConfig.kanban}));
    }
  }

  private createKanban(viewConfig: ViewConfig) {
    const config = (viewConfig && viewConfig.kanban) || this.createDefaultConfig();
    const kanban = {id: this.kanbanId, config};
    this.store$.dispatch(new KanbansAction.AddKanban({kanban}));
  }

  private createDefaultConfig(): KanbanConfig {
    return {columns: [], collections: {}};
  }

  private setupSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
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

  public onPatchData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public onRemoveDocument(document: DocumentModel) {
    this.store$.dispatch(
      new DocumentsAction.DeleteConfirm({
        collectionId: document.collectionId,
        documentId: document.id,
      })
    );
  }
}
