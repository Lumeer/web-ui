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
import {combineLatest, Observable, of} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {
  selectDocumentsByCollectionAndQuery,
  selectCollectionsByCustomQueryWithoutLinks,
  selectReadableCollectionsByView,
} from '../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../core/store/documents/document.model';
import {
  filterStemsForCollection,
  queryContainsOnlyFulltexts,
  queryIsEmpty,
} from '../../core/store/navigation/query/query.util';
import {selectQueryDocumentsLoaded} from '../../core/store/documents/documents.state';
import {selectConstraintData} from '../../core/store/constraint-data/constraint-data.state';
import {ConstraintData} from '@lumeer/data-filters';
import {DataQuery} from '../../core/model/data-query';
import {AttributesSettings, View} from '../../core/store/views/view';

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
  public query: DataQuery;

  @Input()
  public view: View;

  @Input()
  public attributesSettings: AttributesSettings;

  @Output()
  public selectCollection = new EventEmitter<Collection>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  public collections$: Observable<Collection[]>;
  public constraintData$: Observable<ConstraintData>;
  public documentsData$: Observable<{loaded: boolean; documents: DocumentModel[]}>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedCollection || changes.query || changes.view) {
      this.subscribeToDocuments();
    }
  }

  private subscribeToDocuments() {
    let documents$: Observable<DocumentModel[]>;
    let loaded$: Observable<boolean>;
    if (this.selectedCollection && this.query) {
      const collectionQuery = filterStemsForCollection(this.selectedCollection.id, this.query);
      documents$ = this.store$.pipe(
        select(selectDocumentsByCollectionAndQuery(this.selectedCollection.id, collectionQuery, this.view))
      );
      loaded$ = this.store$.pipe(select(selectQueryDocumentsLoaded(collectionQuery)), distinctUntilChanged());
    } else {
      documents$ = of([]);
      if (queryIsEmpty(this.query) || queryContainsOnlyFulltexts(this.query)) {
        loaded$ = combineLatest([
          this.store$.pipe(select(selectReadableCollectionsByView(this.view))),
          this.store$.pipe(select(selectQueryDocumentsLoaded(this.query))),
        ]).pipe(
          map(([collections, loaded]) => collections.length === 0 || loaded),
          distinctUntilChanged()
        );
      } else {
        loaded$ = this.store$.pipe(
          select(selectCollectionsByCustomQueryWithoutLinks(this.view, this.query)),
          map(collections => collections.length === 0),
          distinctUntilChanged()
        );
      }
    }

    this.documentsData$ = combineLatest([documents$, loaded$]).pipe(
      map(([documents, loaded]) => ({
        loaded,
        documents,
      }))
    );
    this.collections$ = this.store$.pipe(select(selectCollectionsByCustomQueryWithoutLinks(this.view, this.query)));
  }

  public setActiveCollection(collection: Collection) {
    this.selectCollection.emit(collection);
  }

  public setActiveDocument(document: DocumentModel) {
    this.selectDocument.emit(document);
  }
}
