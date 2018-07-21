/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectCollectionsByQuery} from '../../core/store/collections/collections.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {filter, take, tap, withLatestFrom} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectDocumentsByCustomQuery} from '../../core/store/documents/documents.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectViewCursor} from '../../core/store/views/views.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {CorrelationIdGenerator} from '../../core/store/correlation-id.generator';
import {generateDocumentData} from '../../core/store/documents/document.utils';

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  styleUrls: ['./preview-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewResultsComponent implements OnInit, OnDestroy {

  public selectedCollection: CollectionModel;

  private selectedDocument: DocumentModel;

  public collections$: Observable<CollectionModel[]>;

  public documents$: Observable<DocumentModel[]>;

  public activeIndex = 0;

  private allSubscriptions = new Subscription();
  private dataSubscription: Subscription;

  private query: QueryModel;

  @Output()
  public selectCollection = new EventEmitter<CollectionModel>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  private collectionsCount = -1;
  private documentsCount = -1;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeAll();
  }

  public ngOnDestroy() {
    this.unsubscribeAll();

    if (this.selectedCollection && this.selectedDocument) {
      this.store.dispatch(new ViewsAction.SetCursor({cursor: {collectionId: this.selectedCollection.id, documentId: this.selectedDocument.id}}));
    }
  }

  private subscribeAll() {
    this.collections$ = this.store.select(selectCollectionsByQuery).pipe(
      filter(collections => !isNullOrUndefined(collections) && collections.length > 0)
    );

    this.allSubscriptions.add(this.store.select(selectNavigation).pipe(
      filter(navigation => this.validWorkspace(navigation.workspace))
    ).subscribe(navigation => this.updateNavigation(navigation.query)));

    // initialize when we do not select anything
    this.allSubscriptions.add(this.collections$.pipe(take(1), withLatestFrom(this.store.select(selectViewCursor)))
      .subscribe(([collections, cursor]) => {
        this.collectionsCount = collections.length;
        if (!this.selectedCollection) {
          let collection;
          if (cursor && cursor.collectionId) {
            collection = collections.find(c => c.id === cursor.collectionId);
          }
          if (!collection) {
            collection = collections[0];
          }

          this.setActiveCollection(collection);
        }
      }));
  }

  private updateNavigation(query: QueryModel) {
    this.query = query;
    this.getData();
  }

  private validWorkspace(workspace: Workspace): boolean {
    return !!(workspace && workspace.organizationCode && workspace.projectCode);
  }

  private unsubscribeAll() {
    this.allSubscriptions.unsubscribe();
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  public setActiveCollection(collection: CollectionModel) {
    this.selectedDocument = null;
    this.activeIndex = 0;
    this.selectedCollection = collection;
    this.getData();
    this.selectCollection.emit(collection);
    this.updateCursor();
  }

  private updateCursor() {
    if (this.selectedCollection && this.selectedDocument) {
      this.store.dispatch(new ViewsAction.SetCursor({cursor: {collectionId: this.selectedCollection.id, documentId: this.selectedDocument.id}}));
    }
  }

  private updateDataSubscription(collectionQuery: QueryModel) {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    this.documents$ = this.store.select(selectDocumentsByCustomQuery(collectionQuery));

    this.dataSubscription = this.documents$.pipe(filter(documents => !!documents),
      tap(documents => {
        this.documentsCount = documents.length;
      }),
      withLatestFrom(this.store.select(selectViewCursor)))
      .subscribe(([documents, cursor]) => {

        if (documents.length > 0) {

          let idx;
          if (cursor && cursor.documentId) {
            idx = documents.findIndex(d => d.id === cursor.documentId);
          }
          if (!idx || idx < 0) {
            idx = 0;
          }

          if (this.activeIndex !== idx || !this.selectedDocument) {
            this.activeIndex = idx;

            // we might get different index when a new document was added but it is already selected
            if ((!this.selectedDocument || this.selectedDocument.id !== documents[idx].id) && documents.length > idx) {
              this.setActiveDocument(documents[idx]);
            }
          }
        } else {
          this.setActiveDocument(null);
        }
      });
  }

  private getData() {
    if (this.selectedCollection) {
      const collectionQuery = {...this.query, collectionIds: [this.selectedCollection.id]};
      this.updateDataSubscription(collectionQuery);
      this.store.dispatch(new DocumentsAction.Get({query: collectionQuery}));
    }
  }

  public setActiveDocument($event: DocumentModel) {
    this.selectedDocument = $event;
    this.selectDocument.emit($event);
    this.updateCursor();
  }

  public onNewDocument() {
    this.store.dispatch(new DocumentsAction.Create({
      document: {
        collectionId: this.selectedCollection.id,
        correlationId: CorrelationIdGenerator.generate(),
        data: generateDocumentData(this.selectedCollection, this.query.filters)
      },
      callback: id => {
        this.store.dispatch(new ViewsAction.SetCursor({cursor: {collectionId: this.selectedCollection.id, documentId: id}}));
      }
    }));
  }

}
