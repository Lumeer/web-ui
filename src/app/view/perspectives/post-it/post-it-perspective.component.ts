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

import {Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {skipWhile} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../core/store/app.state';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCustomQuery} from '../../../core/store/documents/documents.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {PostItLayout} from '../../../shared/utils/layout/post-it-layout';
import {PostItLayoutConfig} from '../../../shared/utils/layout/post-it-layout-config';
import {PostItSortingLayout} from '../../../shared/utils/layout/post-it-sorting-layout';
import {InfiniteScroll} from './bussiness/infinite-scroll';
import {NavigationManager} from './bussiness/navigation-manager';
import {SelectionManager} from './bussiness/selection-manager';
import {PostItDocumentModel} from './document-data/post-it-document-model';
import Create = DocumentsAction.Create;
import Delete = DocumentsAction.Delete;
import UpdateData = DocumentsAction.UpdateData;

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss']
})
export class PostItPerspectiveComponent implements OnInit, OnDestroy {

  @Input()
  public editable: boolean = true;

  private _useOwnScrollbar = false;

  @Input()
  public get useOwnScrollbar(): boolean {
    return this._useOwnScrollbar;
  }

  public set useOwnScrollbar(value: boolean) {
    this._useOwnScrollbar = value;

    if (this.infiniteScrollManager) {
      this.infiniteScrollManager.setUseParentScrollbar(value);
    }
  }

  @ViewChild('layout')
  public layoutElement: ElementRef;

  public perspectiveId: string;

  public postIts: PostItDocumentModel[] = [];

  public infiniteScrollManager: InfiniteScroll;

  public navigationManager: NavigationManager;

  public selectionManager: SelectionManager;

  private layoutManager: PostItLayout;

  private pageSubscriptions: Subscription[] = [];

  private allLoaded: boolean;

  private page = 0;

  constructor(private store: Store<AppState>,
              private zone: NgZone,
              private element: ElementRef) {
  }

  public ngOnInit(): void {
    this.perspectiveId = String(Math.floor(Math.random() * 1000000000000000) + 1);

    this.layoutManager = new PostItSortingLayout(
      '.post-it-document-layout',
      new PostItLayoutConfig(),
      this.sortByOrder,
      'post-it-document',
      this.zone
    );

    this.infiniteScrollManager = new InfiniteScroll(
      () => this.loadMoreOnInfiniteScroll(),
      this.element.nativeElement,
      this.useOwnScrollbar
    );
    this.infiniteScrollManager.initialize();

    this.selectionManager = new SelectionManager(
      this.postIts,
      () => this.documentsPerRow(),
      this.perspectiveId
    );

    this.navigationManager = new NavigationManager(this.store, () => this.documentsPerRow());
    this.navigationManager.setCallback(() => this.reinitializePostIts());
    this.navigationManager.initialize();
  }

  private loadMoreOnInfiniteScroll(): void {
    if (!this.allLoaded && this.navigationManager && this.navigationManager.validNavigation()) {
      this.getPostIts();
    }
  }

  private reinitializePostIts(): void {
    this.resetToInitialState();
    this.getPostIts();
  }

  private resetToInitialState(): void {
    this.allLoaded = false;
    this.page = 0;
    this.postIts.splice(0);
    this.pageSubscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private getPostIts(): void {
    this.infiniteScrollManager.startLoading();

    const queryModel = this.navigationManager.queryWithPagination(this.page++, this.editable);
    this.fetchQueryDocuments(queryModel);
    this.subscribeOnDocuments(queryModel);
  }

  public fetchQueryDocuments(queryModel: QueryModel): void {
    this.store.dispatch(new DocumentsAction.Get({query: queryModel}));
  }

  private subscribeOnDocuments(queryModel: QueryModel) {
    const subscription = this.store.select(selectDocumentsByCustomQuery(queryModel)).pipe(
      skipWhile(() => !this.navigationManager.validNavigation())
    ).subscribe(documents => {
      setTimeout(() => {
        this.checkAllLoaded(documents);

        this.replaceDocumentsInLayout(documents);
        this.addDocumentsNotInLayout(documents);

        this.infiniteScrollManager.finishLoading();
        this.layoutManager.refresh();
      });
    });

    this.pageSubscriptions.push(subscription);
  }

  private checkAllLoaded(documents: DocumentModel[]): void {
    this.allLoaded = documents.length === 0;
  }

  private replaceDocumentsInLayout(documents): void {
    const usedDocumentIDs = new Set(this.postIts.map(postIt => postIt.documentModel.id));
    documents
      .filter(documentModel => usedDocumentIDs.has(documentModel.id))
      .forEach(documentModel => this.replaceDocument(documentModel));
  }

  private replaceDocument(documentModel: DocumentModel): void {
    const replaced = this.postIts.findIndex(postIt => postIt.documentModel.id === documentModel.id);
    this.postIts[replaced] = this.documentModelToPostItModel(documentModel, true);
  }

  private addDocumentsNotInLayout(documents: DocumentModel[]): void {
    const usedDocumentIDs = new Set(this.postIts.map(postIt => postIt.documentModel.id));
    documents
      .filter(documentModel => !usedDocumentIDs.has(documentModel.id))
      .map(documentModel => this.documentModelToPostItModel(documentModel, true))
      .forEach(postIt => this.postIts.push(postIt));
  }

  public createPostIt(document: DocumentModel): void {
    this.postIts.unshift(this.documentModelToPostItModel(document, false));
    this.layoutManager.refresh();
  }

  public postItChanged(postIt: PostItDocumentModel): void {
    if (!postIt.initialized) {
      this.initializePostIt(postIt);
      return;
    }

    this.updateDocument(postIt);
  }

  private updateDocument(postIt: PostItDocumentModel) {
    this.store.dispatch(new UpdateData(
      {
        collectionCode: postIt.documentModel.collectionCode,
        documentId: postIt.documentModel.id,
        data: postIt.documentModel.data
      }
    ));
  }

  private initializePostIt(postItToInitialize: PostItDocumentModel): void {
    if (!postItToInitialize.updating) {
      postItToInitialize.updating = true;
      this.store.dispatch(new Create({document: postItToInitialize.documentModel}));
      this.postIts.splice(this.postIts.indexOf(postItToInitialize), 1);
    }
  }

  public deletePostIt(postIt: PostItDocumentModel): void {
    if (postIt.initialized) {
      this.store.dispatch(new Delete(
        {
          collectionCode: postIt.documentModel.collectionCode,
          documentId: postIt.documentModel.id
        }
      ));
    }

    this.postIts.splice(postIt.index, 1);
    this.layoutManager.refresh();
  }

  public usedCollections(): CollectionModel[] {
    return Array.from(new Set(this.postIts.map(postIt => postIt.documentModel.collection)));
  }

  public postItWithIndex(postIt: PostItDocumentModel, index: number): PostItDocumentModel {
    postIt.index = index;
    return postIt;
  }

  public isAddButtonShown(): boolean {
    return this.editable && this.navigationManager.hasOneCollection();
  }

  private documentModelToPostItModel(documentModel: DocumentModel, initialized: boolean): PostItDocumentModel {
    const postIt = new PostItDocumentModel();
    postIt.documentModel = documentModel;
    postIt.initialized = initialized;

    if (!initialized) {
      postIt.order = 0;
    } else {
      postIt.order = 1;
    }

    return postIt;
  }

  private documentsPerRow(): number {
    const postItWidth = 225;
    const layoutWidth = this.layoutElement.nativeElement.clientWidth;

    return Math.max(1, Math.floor(layoutWidth / postItWidth));
  }

  private sortByOrder(item: any, element: HTMLElement): number {
    return Number(element.getAttribute('order'));
  }

  public trackByIndex(index: number, obj: any): number {
    return index;
  }

  public ngOnDestroy(): void {
    this.navigationManager.destroy();
    this.infiniteScrollManager.destroy();
    this.pageSubscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
