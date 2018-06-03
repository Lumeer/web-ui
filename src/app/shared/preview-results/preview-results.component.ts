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

import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription, Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectCollectionById, selectCollectionsByQuery} from '../../core/store/collections/collections.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {filter, take, tap, withLatestFrom} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {DocumentModel} from '../../core/store/documents/document.model';
import {selectDocumentsByCustomQuery} from '../../core/store/documents/documents.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {ConditionType, QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectViewCursor} from '../../core/store/views/views.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {CorrelationIdGenerator} from '../../core/store/correlation-id.generator';
import {QueryConverter} from '../../core/store/navigation/query.converter';

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  styleUrls: ['./preview-results.component.scss']
})
export class PreviewResultsComponent implements OnInit, OnDestroy {

  public selectedCollection: CollectionModel;

  private selectedDocument: DocumentModel;

  public collections$: Observable<CollectionModel[]>;

  public documents$: Observable<DocumentModel[]>;

  public collection$: Observable<CollectionModel>;

  public activeIndex = 0;

  private allSubscriptions = new Subscription();

  private query: QueryModel;

  private collectionQuery: QueryModel;

  @Output()
  public selectCollection = new EventEmitter<CollectionModel>();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  private collectionsCount = -1;
  private documentsCount = -1;

  constructor(private store: Store<AppState>) { }

  public ngOnInit() {
    this.subscribeAll();
  }

  public ngOnDestroy() {
    this.unsubscribeAll();
  }

  private subscribeAll() {
    this.collections$ = this.store.select(selectCollectionsByQuery).pipe(
      filter(collections => !isNullOrUndefined(collections) && collections.length > 0)
    );

    this.allSubscriptions.add(this.store.select(selectNavigation).pipe(
      filter(navigation => this.validWorkspace(navigation.workspace))
    ).subscribe(navigation => this.updateNavigation(navigation.query)));

    // initialize when we do not select anything
    this.allSubscriptions.add(this.collections$.pipe(filter(collections => !!collections), take(1), withLatestFrom(this.store.select(selectViewCursor)))
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
    if (workspace && workspace.organizationCode && workspace.projectCode) {
      return true;
    }
    return false;
  }

  private unsubscribeAll() {
    this.allSubscriptions.unsubscribe();
  }

  public setActiveCollection(collection: CollectionModel) {
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

  private updateDataSubscription() {
    if (this.collectionQuery) {
      this.documents$ = this.store.select(selectDocumentsByCustomQuery(this.collectionQuery));
      this.collection$ = this.store.select(selectCollectionById(this.selectedCollection.id));

      this.allSubscriptions.add(this.documents$.pipe(filter(documents => !!documents && documents.length > 0),
        tap(documents => {
          this.documentsCount = documents.length;
        }),
        //take(1),
        withLatestFrom(this.store.select(selectViewCursor)))
        .subscribe(([documents, cursor]) => {
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
            if (!this.selectedDocument || this.selectedDocument.id !== documents[idx].id) {
              this.setActiveDocument(documents[idx]);
            }
          }
        }));
    }
  }

  private getData() {
    if (this.selectedCollection) {
      this.collectionQuery = Object.assign({}, this.query,{ collectionIds: [this.selectedCollection.id] });
      this.updateDataSubscription();
      this.store.dispatch(new DocumentsAction.Get({ query: this.collectionQuery }));
    }
  }

  private setActiveDocument($event: DocumentModel) {
    this.selectedDocument = $event;
    this.selectDocument.emit($event);
    this.updateCursor();
  }

  public onNewDocument() {
    this.store.dispatch(new DocumentsAction.Create({
      document: {
        collectionId: this.selectedCollection.id,
        correlationId: CorrelationIdGenerator.generate(),
        data: this.createData()
        },
      callback: id => {
        this.store.dispatch(new ViewsAction.SetCursor({cursor: {collectionId: this.selectedCollection.id, documentId: id}}));

      }
    }));
  }

  private createData(): { [attributeId: string]: any } {
    if (!this.selectedCollection) {
      return [];
    }
    const data = this.selectedCollection.attributes.reduce((acc, attr) => {
      acc[attr.id] = '';
      return acc;
    }, {});

    if (this.query.filters) {
      this.query.filters.map(filter => {
        const attrFilter = QueryConverter.parseFilter(filter);

        if (attrFilter.collectionId === this.selectedCollection.id) {
          switch (attrFilter.conditionType) {
            case ConditionType.GreaterThan:
              data[attrFilter.attributeId] = attrFilter.value + 1;
              break;
            case ConditionType.LowerThan:
              data[attrFilter.attributeId] = attrFilter.value - 1;
              break;
            case ConditionType.NotEquals:
              if (attrFilter.value) {
                if (typeof attrFilter.value === 'number') {
                  data[attrFilter.attributeId] = attrFilter.value + 1;
                } else {
                  data[attrFilter.attributeId] = '';
                }
              } else {
                data[attrFilter.attributeId] = 'N/A';
              }
              break;
            case ConditionType.GreaterThanEquals:
            case ConditionType.LowerThanEquals:
            case ConditionType.Equals:
            default:
              data[attrFilter.attributeId] = attrFilter.value;
          }
        }
      });
    }

    return data;
  }

}
