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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectCollectionsByQuery, selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {filter, take, withLatestFrom} from 'rxjs/operators';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectViewCursor} from '../../core/store/views/views.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {CorrelationIdGenerator} from '../../core/store/correlation-id.generator';
import {generateDocumentData} from '../../core/store/documents/document.utils';
import {selectQueryDocumentsLoaded} from '../../core/store/documents/documents.state';

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  styleUrls: ['./preview-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public selectedCollection: CollectionModel;

  @Input() public selectedDocument: DocumentModel;

  @Output()
  public selectCollection = new EventEmitter<CollectionModel>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  public collections$: Observable<CollectionModel[]>;

  public documents$: Observable<DocumentModel[]>;
  public loaded$ = new BehaviorSubject<boolean>(false);

  private allSubscriptions = new Subscription();
  private dataSubscription = new Subscription();
  private collectionSubscription = new Subscription();

  private query: QueryModel;
  private lastCollectionId: string;

  constructor(private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeAll();
    this.updateDefaultCollectionSubscription();
  }

  private subscribeAll() {
    this.collections$ = this.store.select(selectCollectionsByQuery);

    this.allSubscriptions.add(
      this.store
        .select(selectNavigation)
        .pipe(
          filter(navigation => this.validWorkspace(navigation.workspace)),
          withLatestFrom(this.store.select(selectCollectionsByQuery))
        )
        .subscribe(([navigation, collections]) => {
          this.query = navigation.query;
          this.checkCollectionsAfterQueryChange(collections);
        })
    );
  }

  private validWorkspace(workspace: Workspace): boolean {
    return !!(workspace && workspace.organizationCode && workspace.projectCode);
  }

  private checkCollectionsAfterQueryChange(newCollections: CollectionModel[]) {
    if (!this.selectedCollection) {
      return;
    }

    const isCollectionIncluded = !!newCollections.find(coll => coll.id === this.selectedCollection.id);

    if (isCollectionIncluded) {
      this.getData(this.selectedCollection);
    } else {
      this.updateDefaultCollectionSubscription();
    }
  }

  private updateDefaultCollectionSubscription() {
    this.collectionSubscription.unsubscribe();
    this.collectionSubscription = this.store
      .select(selectCollectionsByQuery)
      .pipe(
        filter(collections => this.shouldChangeSelectedCollection(collections)),
        take(1),
        withLatestFrom(this.store.select(selectViewCursor))
      )
      .subscribe(([collections, cursor]) => {
        let collection: CollectionModel;
        if (cursor && cursor.collectionId) {
          collection = collections.find(c => c.id === cursor.collectionId);
        }
        if (!collection) {
          collection = collections[0];
        }

        this.setActiveCollection(collection);
      });
  }

  private shouldChangeSelectedCollection(collections: CollectionModel[]): boolean {
    return (
      collections.length > 0 &&
      (!this.selectedCollection || !collections.find(coll => coll.id === this.selectedCollection.id))
    );
  }

  public setActiveCollection(collection: CollectionModel) {
    this.selectCollection.emit(collection);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.selectedCollection && this.selectedCollection.id !== this.lastCollectionId) {
      this.lastCollectionId = this.selectedCollection.id;
      this.getData(this.selectedCollection);
    }
  }

  private getData(collection: CollectionModel) {
    const collectionQuery = {...this.query, collectionIds: [collection.id]};
    this.updateDataSubscription(collectionQuery);
    this.store.dispatch(new DocumentsAction.Get({query: collectionQuery}));
    this.allSubscriptions.add(
      this.store.select(selectQueryDocumentsLoaded(collectionQuery)).subscribe(loaded => this.loaded$.next(loaded))
    );
  }

  private updateDataSubscription(collectionQuery: QueryModel) {
    this.documents$ = this.store.select(selectDocumentsByCustomQuery(collectionQuery));

    this.dataSubscription.unsubscribe();
    this.dataSubscription = this.documents$
      .pipe(
        filter(documents => this.shouldChangeSelectedDocument(documents)),
        take(1),
        withLatestFrom(this.store.select(selectViewCursor))
      )
      .subscribe(([documents, cursor]) => {
        let document: DocumentModel;
        if (cursor && cursor.documentId) {
          document = documents.find(d => d.id === cursor.documentId);
        }
        if (!document) {
          document = documents[0];
        }

        this.setActiveDocument(document);
      });
  }

  private shouldChangeSelectedDocument(documents: DocumentModel[]): boolean {
    return (
      documents.length > 0 && (!this.selectedDocument || !documents.find(doc => doc.id === this.selectedDocument.id))
    );
  }

  public setActiveDocument(document: DocumentModel) {
    this.selectDocument.emit(document);
  }

  public ngOnDestroy() {
    this.unsubscribeAll();
    this.updateCursor();
  }

  private unsubscribeAll() {
    this.allSubscriptions.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.collectionSubscription.unsubscribe();
  }

  private updateCursor() {
    if (this.selectedCollection && this.selectedDocument) {
      this.store.dispatch(
        new ViewsAction.SetCursor({
          cursor: {collectionId: this.selectedCollection.id, documentId: this.selectedDocument.id},
        })
      );
    }
  }

  public onNewDocument() {
    this.store.dispatch(
      new DocumentsAction.Create({
        document: {
          collectionId: this.selectedCollection.id,
          correlationId: CorrelationIdGenerator.generate(),
          data: generateDocumentData(this.selectedCollection, this.query.filters),
        },
        callback: id => {
          this.store.dispatch(
            new ViewsAction.SetCursor({cursor: {collectionId: this.selectedCollection.id, documentId: id}})
          );
        },
      })
    );
  }
}
