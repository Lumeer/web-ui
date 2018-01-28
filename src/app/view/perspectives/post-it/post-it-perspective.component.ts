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
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../core/store/app.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCustomQuery} from '../../../core/store/documents/documents.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {PostItLayout} from '../../../shared/utils/layout/post-it-layout';
import {PostItLayoutConfig} from '../../../shared/utils/layout/post-it-layout-config';
import {PostItSortingLayout} from '../../../shared/utils/layout/post-it-sorting-layout';
import {PostItDocumentModel} from './document-data/post-it-document-model';
import {DeletionHelper} from './util/deletion-helper';
import {InfiniteScroll} from './util/infinite-scroll';
import {NavigationHelper} from './util/navigation-helper';
import {SelectionHelper} from './util/selection-helper';
import Create = DocumentsAction.Create;
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

    if (this.infiniteScroll) {
      this.infiniteScroll.setUseParentScrollbar(value);
    }
  }

  @ViewChild('layout')
  public layoutElement: ElementRef;

  public infiniteScroll: InfiniteScroll;

  public perspectiveId: string;

  public postIts: PostItDocumentModel[] = [];

  public navigationHelper: NavigationHelper;

  public selectionHelper: SelectionHelper;

  private deletionHelper: DeletionHelper;

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

    this.infiniteScroll = new InfiniteScroll(
      () => this.loadMoreOnInfiniteScroll(),
      this.element.nativeElement,
      this.useOwnScrollbar
    );
    this.infiniteScroll.initialize();

    this.selectionHelper = new SelectionHelper(
      this.postIts,
      () => this.documentsPerRow(),
      this.perspectiveId
    );

    this.navigationHelper = new NavigationHelper(this.store, () => this.documentsPerRow());
    this.navigationHelper.setCallback(() => this.reinitializePostIts());
    this.navigationHelper.initialize();

    this.deletionHelper = new DeletionHelper(this.store, this.postIts);
    this.deletionHelper.initialize();
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

  public fetchQueryDocuments(queryModel: QueryModel): void {
    this.store.dispatch(new DocumentsAction.Get({query: queryModel}));
  }

  public isAddButtonShown(): boolean {
    return this.editable && this.navigationHelper.hasOneCollection();
  }

  private checkAllLoaded(documents: DocumentModel[]): void {
    this.allLoaded = documents.length === 0;
  }

  private loadMoreOnInfiniteScroll(): void {
    if (!this.allLoaded && this.navigationHelper && this.navigationHelper.validNavigation()) {
      this.getPostIts();
    }
  }

  private getPostIts(): void {
    this.infiniteScroll.startLoading();

    const queryModel = this.navigationHelper.queryWithPagination(this.page++, this.editable);
    this.fetchQueryDocuments(queryModel);
    this.subscribeOnDocuments(queryModel);
  }

  public createPostIt(document: DocumentModel): void {
    const newPostIt = this.documentModelToPostItModel(document);
    this.postIts.unshift(newPostIt);

    setTimeout(() => {
      this.selectionHelper.select(0, 0, newPostIt);
      this.selectionHelper.setEditMode(true);
      this.selectionHelper.focus();
    });
  }

  public postItChanged(changedPostIt: PostItDocumentModel): void {
    if (Object.keys(changedPostIt.document.data).length === 0) {
      this.postIts.splice(this.postIts.findIndex(postIt => postIt === changedPostIt), 1);

      if (changedPostIt.initialized) {
        this.deletePostIt(changedPostIt);
      }
      return;
    }

    if (!changedPostIt.initialized) {
      this.initializePostIt(changedPostIt);
      return;
    }

    this.updateDocument(changedPostIt);
  }

  private subscribeOnDocuments(queryModel: QueryModel) {
    const subscription = this.store.select(selectDocumentsByCustomQuery(queryModel)).pipe(
      filter(() => this.canFetchDocuments())
    ).subscribe(documents => this.updateLayoutWithDocuments(documents));

    this.pageSubscriptions.push(subscription);
  }

  private canFetchDocuments() {
    return this.navigationHelper.validNavigation();
  }

  private updateLayoutWithDocuments(documents) {
    setTimeout(() => {
      this.checkAllLoaded(documents);
      this.addDocumentsNotInLayout(documents);
      this.focusNewDocumentIfPresent(documents);

      this.infiniteScroll.finishLoading();
      this.layoutManager.refresh();
    });
  }

  private addDocumentsNotInLayout(documents: DocumentModel[]): void {
    const usedDocumentIDs = new Set(this.postIts.map(postIt => postIt.document.id));
    documents
      .filter(documentModel => !usedDocumentIDs.has(documentModel.id))
      .forEach(documentModel => this.postIts.push(this.documentModelToPostItModel(documentModel)));
  }

  private focusNewDocumentIfPresent(documents: DocumentModel[]): void {
    const newDocument = documents.find(document => Boolean(document.correlationId));

    if (newDocument) {
      this.focusDocument(newDocument);
    }
  }

  private focusDocument(document: DocumentModel): void {
    const focusedPostIt = this.findPostItOfDocument(document);

    setTimeout(() => {
      this.selectionHelper.select(1, 0, focusedPostIt);
      this.selectionHelper.focus();
    });
  }

  private findPostItOfDocument(document: DocumentModel): PostItDocumentModel {
    return this.postIts.find(postIt => postIt.document.id === document.id);
  }

  private updateDocument(postIt: PostItDocumentModel) {
    this.store.dispatch(new UpdateData(
      {
        collectionCode: postIt.document.collectionCode,
        documentId: postIt.document.id,
        data: postIt.document.data
      }
    ));
  }

  private initializePostIt(postItToInitialize: PostItDocumentModel): void {
    if (!postItToInitialize.updating) {
      postItToInitialize.updating = true;
      postItToInitialize.document.correlationId = String(Math.floor(Math.random() * 1000000000000000) + 1);

      this.store.dispatch(new Create({document: postItToInitialize.document}));
      this.postIts.splice(this.postIts.indexOf(postItToInitialize), 1);
    }
  }

  public deletePostIt(postIt: PostItDocumentModel): void {
    this.deletionHelper.deletePostIt(postIt);
  }

  private documentModelToPostItModel(documentModel: DocumentModel): PostItDocumentModel {
    const postIt = new PostItDocumentModel();
    postIt.document = documentModel;
    postIt.initialized = Boolean(documentModel.id);

    if (!postIt.initialized) {
      postIt.order = -this.postIts.length;
    } else {
      postIt.order = this.postIts.length;
    }

    return postIt;
  }

  public postItWithIndex(postIt: PostItDocumentModel, index: number): PostItDocumentModel {
    postIt.index = index;
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
    if (this.deletionHelper) {
      this.deletionHelper.destroy();
    }

    if (this.navigationHelper) {
      this.navigationHelper.destroy();
    }

    if (this.infiniteScroll) {
      this.infiniteScroll.destroy();
    }

    this.pageSubscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
