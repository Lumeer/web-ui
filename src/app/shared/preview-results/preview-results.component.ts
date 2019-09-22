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
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, take, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {selectCollectionsByQuery, selectDocumentsByCustomQuery} from '../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../core/store/documents/document.model';
import {generateDocumentData} from '../../core/store/documents/document.utils';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectQueryDocumentsLoaded} from '../../core/store/documents/documents.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectNavigation, selectViewCursor} from '../../core/store/navigation/navigation.state';
import {Query, QueryStem} from '../../core/store/navigation/query/query';
import {getQueryFiltersForCollection} from '../../core/store/navigation/query/query.util';
import {Workspace} from '../../core/store/navigation/workspace';
import {generateCorrelationId} from '../utils/resource.utils';

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  styleUrls: ['./preview-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public selectedCollection: Collection;

  @Input() public selectedDocument: DocumentModel;

  @Output()
  public selectCollection = new EventEmitter<Collection>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  public collections$: Observable<Collection[]>;

  public documents$: Observable<DocumentModel[]>;
  public loaded$ = new BehaviorSubject<boolean>(false);

  private allSubscriptions = new Subscription();
  private dataSubscription = new Subscription();
  private collectionSubscription = new Subscription();

  private query: Query;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeAll();
    this.updateDefaultCollectionSubscription();
  }

  private subscribeAll() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));

    this.allSubscriptions.add(
      this.store$
        .pipe(
          select(selectNavigation),
          filter(navigation => this.validWorkspace(navigation.workspace)),
          withLatestFrom(this.store$.pipe(select(selectCollectionsByQuery)))
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

  private checkCollectionsAfterQueryChange(newCollections: Collection[]) {
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
    this.collectionSubscription = this.store$
      .pipe(
        select(selectCollectionsByQuery),
        filter(collections => this.shouldChangeSelectedCollection(collections)),
        take(1),
        withLatestFrom(this.store$.pipe(select(selectViewCursor)))
      )
      .subscribe(([collections, cursor]) => {
        let collection: Collection;
        if (cursor && cursor.collectionId) {
          collection = collections.find(c => c.id === cursor.collectionId);
        }
        if (!collection) {
          collection = collections[0];
        }

        this.setActiveCollection(collection);
      });
  }

  private shouldChangeSelectedCollection(collections: Collection[]): boolean {
    return (
      collections.length > 0 &&
      (!this.selectedCollection || !collections.find(coll => coll.id === this.selectedCollection.id))
    );
  }

  public setActiveCollection(collection: Collection) {
    this.selectCollection.emit(collection);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedCollection && this.shouldGetData(changes.selectedCollection)) {
      this.getData(this.selectedCollection);
    }
  }

  private shouldGetData(selectedChange: SimpleChange): boolean {
    return (
      selectedChange.currentValue &&
      (!selectedChange.previousValue || selectedChange.currentValue.id !== selectedChange.previousValue.id)
    );
  }

  private filterStems(collection: Collection, stems: QueryStem[]): QueryStem[] {
    if (stems.length > 0) {
      return stems.filter(stem => stem.collectionId === collection.id);
    } else {
      return [{collectionId: collection.id}];
    }
  }

  private getData(collection: Collection) {
    const collectionQuery = {
      ...this.query,
      stems: this.filterStems(collection, (this.query && this.query.stems) || []),
    };
    this.updateDataSubscription(collectionQuery);
    this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery}));

    this.loaded$.next(false);
    this.store$
      .pipe(
        select(selectQueryDocumentsLoaded(collectionQuery)),
        filter(loaded => loaded),
        take(1)
      )
      .subscribe(loaded => this.loaded$.next(loaded));
  }

  private updateDataSubscription(collectionQuery: Query) {
    this.documents$ = this.store$.pipe(select(selectDocumentsByCustomQuery(collectionQuery)));

    this.dataSubscription.unsubscribe();
    this.dataSubscription = this.documents$
      .pipe(
        filter(documents => this.shouldChangeSelectedDocument(documents)),
        take(1),
        withLatestFrom(this.store$.pipe(select(selectViewCursor)))
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
  }

  private unsubscribeAll() {
    this.allSubscriptions.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.collectionSubscription.unsubscribe();
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
        callback: id => {
          this.store$.dispatch(
            new NavigationAction.SetViewCursor({cursor: {collectionId: this.selectedCollection.id, documentId: id}})
          );
        },
      })
    );
  }
}
