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
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Query, QueryStem} from '../../../../../core/store/navigation/query/query';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {viewCursorToWorkflowTable, WORKFLOW_SIDEBAR_SELECTOR} from '../tables/service/workflow-utils';
import {WorkflowTablesStateService} from '../tables/service/workflow-tables-state.service';
import {combineLatest, Observable} from 'rxjs';
import {selectViewCursor} from '../../../../../core/store/navigation/navigation.state';
import {map} from 'rxjs/operators';
import {queryStemWithoutFilters} from '../../../../../core/store/navigation/query/query.util';
import {WorkflowsAction} from '../../../../../core/store/workflows/workflows.action';
import {getDefaultAttributeId} from '../../../../../core/store/collections/collection.util';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: WORKFLOW_SIDEBAR_SELECTOR,
  templateUrl: './workflow-sidebar.component.html',
  styleUrls: ['./workflow-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowSidebarComponent implements OnInit, OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public currentView: View;

  @Output()
  public close = new EventEmitter();

  public currentStem$: Observable<QueryStem>;

  public readonly collectionResourceType = AttributesResourceType.Collection;

  constructor(private store$: Store<AppState>, private stateService: WorkflowTablesStateService) {}

  public ngOnInit() {
    this.currentStem$ = combineLatest([
      this.store$.pipe(select(selectViewCursor)),
      this.stateService.tables$.asObservable(),
    ]).pipe(map(([cursor, tables]) => queryStemWithoutFilters(viewCursorToWorkflowTable(cursor, tables)?.stem)));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
      this.loadLinkInstances(this.document);
    }
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  public onCloseClick() {
    this.close.emit();
  }

  public onDocumentSelect(data: {collection: Collection; document: DocumentModel}) {
    this.store$.dispatch(
      new WorkflowsAction.SetOpenedDocument({
        documentId: data.document.id,
        collectionId: data.collection.id,
        attributeId: getDefaultAttributeId(data.collection),
      })
    );
  }
}
