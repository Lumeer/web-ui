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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable, combineLatest} from 'rxjs';
import {map} from 'rxjs/operators';

import {LoadDataService, LoadDataServiceProvider} from '../../../../../core/service/load-data.service';
import {AppState} from '../../../../../core/store/app.state';
import {Collection} from '../../../../../core/store/collections/collection';
import {getDefaultAttributeId} from '../../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {selectViewCursor} from '../../../../../core/store/navigation/navigation.state';
import {Query, QueryStem} from '../../../../../core/store/navigation/query/query';
import {queryStemWithoutFilters} from '../../../../../core/store/navigation/query/query.util';
import {View} from '../../../../../core/store/views/view';
import {WorkflowsAction} from '../../../../../core/store/workflows/workflows.action';
import {WorkflowTablesStateService} from '../tables/service/workflow-tables-state.service';
import {WORKFLOW_SIDEBAR_SELECTOR, viewCursorToWorkflowTable} from '../tables/service/workflow-utils';

@Component({
  selector: WORKFLOW_SIDEBAR_SELECTOR,
  templateUrl: './workflow-sidebar.component.html',
  styleUrls: ['./workflow-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoadDataServiceProvider],
})
export class WorkflowSidebarComponent implements OnInit, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public currentView: View;

  @Input()
  public workflowId: string;

  @Input()
  public isEmbedded: boolean;

  @Output()
  public close = new EventEmitter();

  public currentStem$: Observable<QueryStem>;

  constructor(
    private store$: Store<AppState>,
    private stateService: WorkflowTablesStateService,
    private loadDataService: LoadDataService
  ) {}

  public ngOnInit() {
    this.currentStem$ = combineLatest([
      this.store$.pipe(select(selectViewCursor)),
      this.stateService.tables$.asObservable(),
    ]).pipe(map(([cursor, tables]) => queryStemWithoutFilters(viewCursorToWorkflowTable(cursor, tables)?.stem)));
  }

  public onCloseClick() {
    this.close.emit();
  }

  public onDocumentSelect(data: {collection: Collection; document: DocumentModel}) {
    this.store$.dispatch(
      new WorkflowsAction.SetOpenedDocument({
        workflowId: this.workflowId,
        documentId: data.document.id,
        collectionId: data.collection.id,
        attributeId: getDefaultAttributeId(data.collection),
      })
    );
  }

  public ngOnDestroy() {
    this.loadDataService.destroy();
  }
}
