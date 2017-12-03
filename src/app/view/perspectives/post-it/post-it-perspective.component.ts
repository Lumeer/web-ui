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
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {Store} from '@ngrx/store';

import {DocumentService} from 'app/core/rest/document.service';
import {SearchService} from 'app/core/rest/search.service';
import {Collection, Document, Query} from '../../../core/dto';
import {CollectionService} from '../../../core/rest';
import {AppState} from '../../../core/store/app.state';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {PostItLayout} from '../../../shared/utils/post-it-layout';
import {AttributePropertySelection} from './document-data/attribute-property-selection';
import {Direction} from './document-data/direction';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {NotificationService} from '../../../core/notifications/notification.service';
import {DocumentModel} from './document-data/document-model';
import {Subscription} from 'rxjs';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItPerspectiveComponent implements OnInit, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean = true;

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChildren(PostItDocumentComponent)
  public documentComponents: QueryList<PostItDocumentComponent> = new QueryList();

  public postIts: DocumentModel[] = [];

  private layout: PostItLayout;

  public lastClickedPostIt: DocumentModel;

  public fetchingData: boolean;

  public collections: { [collectionCode: string]: Collection } = {};

  private attributeSuggestions: { [collectionCode: string]: string[] } = {};

  private infiniteScrollCallback: () => void | null;

  private page = 0;

  private layoutGutter = 10;

  private fetchedCollections = 0;

  private collectionsToFetch = 0;

  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  private scrollEventOptions = {
    capture: true,
    passive: true
  };

  private querySubscription: Subscription;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private searchService: SearchService,
              private notificationService: NotificationService,
              private store: Store<AppState>,
              private zone: NgZone) {
  }

  public ngOnInit(): void {
    this.initializeLayout();
    this.setInfiniteScroll(true);

    this.querySubscription = this.store.select(selectNavigation).subscribe(navigation => {
      this.query = navigation.query;
      this.fetchPostIts();
    });
  }

  public suggestedAttributes(): [string, string[]][] {
    return Object.entries(this.attributeSuggestions);
  }

  private initializeLayout(): void {
    this.layout = new PostItLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: this.layoutGutter
    }, this.zone);
  }

  public setInfiniteScroll(enabled: boolean): void {
    if (enabled) {
      this.turnOnInfiniteScroll();
    } else {
      this.turnOffInfiniteScroll();
    }
  }

  private turnOnInfiniteScroll(): void {
    if (this.infiniteScrollCallback) {
      this.turnOffInfiniteScroll();
    }

    this.infiniteScrollCallback = () => {
      if (this.fetchingData) {
        return;
      }

      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 550) {
        this.fetchPostIts();
      }
    };

    (<any>window).addEventListener('scroll', this.infiniteScrollCallback, this.scrollEventOptions);
  }

  private turnOffInfiniteScroll(): void {
    (<any>window).removeEventListener('scroll', this.infiniteScrollCallback, this.scrollEventOptions);
    this.infiniteScrollCallback = null;
  }

  private selectedAttributeProperty(): AttributePropertySelection {
    return this.postIts[0] ? this.postIts[0].selectedInput : this.emptySelection();
  }

  private emptySelection(): AttributePropertySelection {
    return {
      row: null,
      column: null,
      documentIdx: null,
      direction: Direction.Self,
      editing: false
    };
  }

  public selectDocument(selection: AttributePropertySelection): void {
    switch (selection.direction) {
      case Direction.Left:
        this.tryToSelectDocumentOnLeft(selection);
        break;
      case Direction.Right:
        this.tryToSelectDocumentOnRight(selection);
        break;
      case Direction.Up:
        this.tryToSelectDocumentOnUp(selection);
        break;
      case Direction.Down:
        this.tryToSelectDocumentOnDown(selection);
        break;
    }
  }

  private tryToSelectDocumentOnLeft(selection: AttributePropertySelection): void {
    if (selection.documentIdx - 1 >= 0) {
      const selectedDocument = this.documentComponents.toArray()[selection.documentIdx - 1];
      this.lastClickedPostIt = this.postIts[selection.documentIdx - 1];
      selectedDocument.select(Number.MAX_SAFE_INTEGER, selection.row);
    }
  }

  private tryToSelectDocumentOnRight(selection: AttributePropertySelection): void {
    if (selection.documentIdx + 1 < this.postIts.length) {
      const selectedDocument = this.documentComponents.toArray()[selection.documentIdx + 1];
      this.lastClickedPostIt = this.postIts[selection.documentIdx + 1];
      selectedDocument.select(0, selection.row);
    }
  }

  private tryToSelectDocumentOnUp(selection: AttributePropertySelection): void {
    if (selection.documentIdx - this.documentsPerRow() >= 0) {
      const selectedDocument = this.documentComponents.toArray()[selection.documentIdx - this.documentsPerRow()];
      this.lastClickedPostIt = this.postIts[selection.documentIdx - this.documentsPerRow()];
      selectedDocument.select(selection.column, Number.MAX_SAFE_INTEGER);
    }
  }

  private tryToSelectDocumentOnDown(selection: AttributePropertySelection): void {
    if (selection.documentIdx + this.documentsPerRow() < this.postIts.length) {
      const selectedDocument = this.documentComponents.toArray()[selection.documentIdx + this.documentsPerRow()];
      this.lastClickedPostIt = this.postIts[selection.documentIdx + this.documentsPerRow()];
      selectedDocument.select(selection.column, 0);
    }
  }

  private documentsPerRow(): number {
    // padding - postIt - padding - postIt - padding
    const postItWidth = 215;
    const postItPaddingOnOneSide = this.layoutGutter;
    const totalPostItWidth = postItWidth + postItPaddingOnOneSide;

    const layoutWidth = this.layoutElement.nativeElement.clientWidth;
    const layoutWidthWithoutPaddingOnLeft = layoutWidth - postItPaddingOnOneSide;

    return Math.floor(layoutWidthWithoutPaddingOnLeft / totalPostItWidth);
  }

  private queryPage(pageNumber: number): Query {
    const addDocumentPresent = this.editable && pageNumber === 0 ? 1 : 0;

    return {
      pageSize: this.documentsPerRow() * 4 - addDocumentPresent,
      page: pageNumber,
      filters: this.query.filters,
      fulltext: this.query.fulltext,
      collectionCodes: this.query.collectionCodes
    };
  }

  private fetchPostIts(): void {
    if (this.fetchingData) {
      return;
    }

    this.setFetchingPageStarted();
    this.searchService.searchDocuments(this.queryPage(this.page)).pipe(
      finalize(() => this.setFetchingPageFinished())
    ).subscribe(
      documents => this.fetchDocumentData(documents),
      error => this.notificationService.error('Failed fetching documents')
    );
  }

  private setFetchingPageStarted(): void {
    this.fetchingData = true;
    this.setInfiniteScroll(false);
  }

  private setFetchingPageFinished(): void {
    this.fetchingData = false;
    this.setInfiniteScroll(true);
    this.page++;
  }

  private fetchDocumentData(documents: Document[]): void {
    documents.forEach(document => this.postIts.push(this.documentToPostIt(document, true)));

    const uniqueCollectionCodes = new Set(documents.map(document => document.collectionCode));
    this.fetchCollections(uniqueCollectionCodes);
  }

  private documentToPostIt(document: Document, initialized: boolean): DocumentModel {
    const postIt = new DocumentModel;
    postIt.document = document;
    postIt.selectedInput = this.selectedAttributeProperty();
    postIt.initialized = initialized;
    postIt.visible = false;

    return postIt;
  }

  private fetchCollections(collectionCodes: Set<string>): void {
    this.fetchedCollections = 0;
    this.collectionsToFetch = collectionCodes.size;

    collectionCodes.forEach(collectionCode => {
      if (this.collections[collectionCode]) {
        this.countAsFetchedAndRefreshIfLast();
        return;
      }

      this.collectionService.getCollection(collectionCode).pipe(
        finalize(() => this.countAsFetchedAndRefreshIfLast())
      ).subscribe(
        collection => this.registerCollection(collection),
        error => this.notificationService.error(`Failed fetching collection ${collectionCode}`)
      );
    });
  }

  private countAsFetchedAndRefreshIfLast(): void {
    this.fetchedCollections++;

    if (this.fetchedCollections === this.collectionsToFetch) {
      this.refresh();
    }
  }

  private registerCollection(collection: Collection): void {
    this.collections[collection.code] = collection;
    this.attributeSuggestions[collection.code] = collection.attributes
      .sort((attribute1, attribute2) => attribute2.usageCount - attribute1.usageCount) // descending order
      .map(attribute => attribute.name);
  }

  public createDocument(document: Document): void {
    this.postIts.unshift(this.documentToPostIt(document, false));
    this.fetchCollections(new Set([document.collectionCode]));
  }

  public toggleDocumentFavorite(postIt: DocumentModel) {
    this.documentService.toggleDocumentFavorite(postIt.document)
      .subscribe(success => {
        if (success) {
          postIt.document.isFavorite = !postIt.document.isFavorite;
        }
      });
  }

  public sendUpdate(postIt: DocumentModel): void {
    if (postIt.initializing) {
      return;
    }

    if (!postIt.initialized) {
      this.initializePostIt(postIt);
      return;
    }

    this.documentService.updateDocument(postIt.document).subscribe(
      document => {
        delete document.data['_id']; // TODO remove after _id is no longer sent inside data
        postIt.document.data = document.data;

        this.refresh();
      },
      error => {
        this.notificationService.error('Failed updating document');
      });
  }

  private initializePostIt(postIt: DocumentModel): void {
    postIt.initializing = true;

    this.documentService.createDocument(postIt.document).pipe(
      finalize(() => postIt.initializing = false)
    ).subscribe((document: Document) => {
        postIt.initialized = true;

        postIt.document.id = document.id;
        this.refreshDocument(postIt);
      },
      error => {
        this.notificationService.error('Failed creating document');
      });
  }

  private refreshDocument(postIt: DocumentModel): void {
    this.documentService.getDocument(postIt.document.collectionCode, postIt.document.id)
      .subscribe(
        document => {
          delete document.data['_id']; // TODO remove after _id is no longer sent inside data
          postIt.document = document;
          this.refresh();
        },
        error => {
          this.notificationService.error('Refreshing document failed');
        });
  }

  public removeDocument(postIt: DocumentModel): void {
    if (postIt.initialized) {
      this.documentService.removeDocument(postIt.document.collectionCode, postIt.document.id).subscribe(
        response => null,
        error => this.notificationService.error('Failed removing document')
      );
    }

    this.postIts.splice(postIt.index, 1);
    this.refresh();
  }

  private refresh(): void {
    this.layout.refresh();
    this.showPostItsWithCollection();
  }

  private showPostItsWithCollection(): void {
    setTimeout(() => {
      this.postIts
        .filter(postIt => this.collections[postIt.document.collectionCode])
        .forEach(postIt => postIt.visible = true);
    });
  }

  public confirmDeletion(postIt: DocumentModel): void {
    this.notificationService.confirm('Are you sure you want to remove the document?', 'Delete?', [
      {text: 'Yes', action: () => this.removeDocument(postIt), bold: false},
      {text: 'No'}
    ]);
  }

  public onClick(event: MouseEvent): void {
    const clickedPostItIndex = this.documentComponents
      .toArray()
      .findIndex(postIt => postIt.element.nativeElement.contains(event.target));
    this.lastClickedPostIt = this.postIts[clickedPostItIndex];
  }

  public ngOnDestroy(): void {
    if (this.layout) {
      this.layout.destroy();
    }

    this.setInfiniteScroll(false);

    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }

  public isAddButtonShown(): boolean {
    return this.editable && this.query && this.query.collectionCodes && this.query.collectionCodes.length === 1;
  }

  public setPostItIndexAndReturn(postIt: DocumentModel, index: number): DocumentModel {
    postIt.index = index;
    return postIt;
  }

}
