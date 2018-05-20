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
import {Subscription} from "rxjs/Subscription";
import {Store} from "@ngrx/store";
import {AppState} from "../../core/store/app.state";
import {selectCollectionById, selectCollectionsByQuery} from "../../core/store/collections/collections.state";
import {Observable} from "rxjs/Observable";
import {CollectionModel} from "../../core/store/collections/collection.model";
import {filter, take, tap} from "rxjs/operators";
import {isNullOrUndefined} from "util";
import {DocumentModel} from "../../core/store/documents/document.model";
import {selectDocumentsByCustomQuery} from "../../core/store/documents/documents.state";
import {selectNavigation} from "../../core/store/navigation/navigation.state";
import {QueryModel} from "../../core/store/navigation/query.model";
import {Workspace} from "../../core/store/navigation/workspace.model";
import {DocumentsAction} from "../../core/store/documents/documents.action";

@Component({
  selector: 'preview-results',
  templateUrl: './preview-results.component.html',
  styleUrls: ['./preview-results.component.scss']
})
export class PreviewResultsComponent implements OnInit, OnDestroy {

  public selectedCollectionId: string;

  public collections$: Observable<CollectionModel[]>;

  public documents$: Observable<DocumentModel[]>;

  public collection$: Observable<CollectionModel>;

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
    this.allSubscriptions.add(this.collections$.pipe(filter(collections => !!collections), take(1))
      .subscribe(collections => {
        this.collectionsCount = collections.length;
        if (!this.selectedCollectionId) {
          this.setActiveCollection(collections[0]);
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
    this.selectedCollectionId = collection.id;
    this.getData();
    this.selectCollection.emit(collection);
  }

  private updateDataSubscription() {
    if (this.collectionQuery) {
      this.documents$ = this.store.select(selectDocumentsByCustomQuery(this.collectionQuery));
      this.collection$ = this.store.select(selectCollectionById(this.selectedCollectionId));

      this.allSubscriptions.add(this.documents$.pipe(filter(documents => !!documents && documents.length > 0),
        tap(documents => {
          this.documentsCount = documents.length;
        }),
        take(1))
        .subscribe(documents => this.setActiveDocument(documents[0])));
    }
  }

  private getData() {
    if (this.selectedCollectionId) {
      this.collectionQuery = Object.assign({}, this.query,{ collectionIds: [this.selectedCollectionId] });
      this.updateDataSubscription();
      this.store.dispatch(new DocumentsAction.Get({ query: this.collectionQuery }));
    }
  }

  private setActiveDocument($event: DocumentModel) {
    this.selectDocument.emit($event);
  }
}
