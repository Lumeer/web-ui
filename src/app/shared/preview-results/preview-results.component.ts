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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {ConstraintData} from '../../core/model/data/constraint';
import {ConstraintDataService} from '../../core/service/constraint-data.service';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {selectCollectionsByQuery, selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../core/store/documents/document.model';
import {generateDocumentData} from '../../core/store/documents/document.utils';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {Query} from '../../core/store/navigation/query/query';
import {filterStemsForCollection, getQueryFiltersForCollection} from '../../core/store/navigation/query/query.util';
import {generateCorrelationId} from '../utils/resource.utils';
import {selectQueryDocumentsLoaded} from '../../core/store/documents/documents.state';
import {Project} from '../../core/store/projects/project';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {Perspective} from '../../view/perspectives/perspective';
import {QueryAction} from '../../core/model/query-action';
import {Router} from '@angular/router';
import {Workspace} from '../../core/store/navigation/workspace';

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsComponent implements OnInit, OnChanges {
  @Input()
  public selectedCollection: Collection;

  @Input()
  public selectedDocument: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Output()
  public selectCollection = new EventEmitter<Collection>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  public collections$: Observable<Collection[]>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;
  public loaded$: Observable<boolean>;
  public project$: Observable<Project>;

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private constraintDataService: ConstraintDataService
  ) {}

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.constraintData$ = this.constraintDataService.observeConstraintData();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedCollection || changes.query) {
      this.subscribeToDocuments();
    }
  }

  private subscribeToDocuments() {
    if (this.selectedCollection && this.query) {
      const collectionQuery = filterStemsForCollection(this.selectedCollection.id, this.query);
      this.documents$ = this.store$.pipe(select(selectDocumentsByCustomQuery(collectionQuery)));
      this.loaded$ = this.store$.pipe(select(selectQueryDocumentsLoaded(collectionQuery)));
    } else {
      this.documents$ = of([]);
      this.loaded$ = of(true);
    }
  }

  public setActiveCollection(collection: Collection) {
    this.selectCollection.emit(collection);
  }

  public setActiveDocument(document: DocumentModel) {
    this.selectDocument.emit(document);
  }

  public onNewDocument() {
    this.store$.dispatch(
      new DocumentsAction.Create({
        document: {
          collectionId: this.selectedCollection.id,
          correlationId: generateCorrelationId(),
          data: generateDocumentData(
            this.selectedCollection,
            getQueryFiltersForCollection(this.query, this.selectedCollection.id)
          ),
        },
        onSuccess: id => {
          this.store$.dispatch(
            new NavigationAction.SetViewCursor({cursor: {collectionId: this.selectedCollection.id, documentId: id}})
          );
        },
      })
    );
  }

  public switchToCollectionsTab() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'collections'], {
      queryParams: {action: QueryAction.CreateCollection},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
