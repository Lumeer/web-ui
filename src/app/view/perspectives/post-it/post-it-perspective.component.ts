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

import {Component, ElementRef, Input, NgZone, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Store} from '@ngrx/store';
import {DocumentService} from 'app/core/rest/document.service';
import {SearchService} from 'app/core/rest/search.service';
import {Subscription} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Collection} from '../../../core/dto/collection';
import {Document} from '../../../core/dto/document';
import {Query} from '../../../core/dto/query';
import {CollectionService} from '../../../core/rest/collection.service';
import {AppState} from '../../../core/store/app.state';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {NotificationService} from '../../../core/notifications/notification.service';
import {PostItLayout} from '../../../shared/utils/post-it-layout';
import {AttributePropertySelection} from './document-data/attribute-property-selection';
import {Direction} from './document-data/direction';
import {DocumentData} from './document-data/document-data';
import {PostItDocumentComponent} from './document/post-it-document.component';

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

  public postIts: DocumentData[] = [];

  private layout: PostItLayout;

  public lastClickedPostIt: DocumentData;

  public fetchingData: boolean;

  public collections: { [collectionCode: string]: Collection } = {};

  private attributeSuggestions: { [collectionCode: string]: string[] } = {};

  private infiniteScrollCallback: () => void | null;

  private page = 0;

  private layoutGutter = 10;

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

  public selectDocument(selector: AttributePropertySelection): void {
    switch (selector.direction) {
      case Direction.Left:
        if (selector.documentIdx - 1 >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - 1].select(Number.MAX_SAFE_INTEGER, selector.row);
        }
        break;

      case Direction.Right:
        if (selector.documentIdx + 1 < this.postIts.length) {
          this.documentComponents.toArray()[selector.documentIdx + 1].select(0, selector.row);
        }
        break;

      case Direction.Up:
        if (selector.documentIdx - this.documentsPerRow() >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - this.documentsPerRow()].select(selector.column, Number.MAX_SAFE_INTEGER);
        }
        break;

      case Direction.Down:
        if (selector.documentIdx + this.documentsPerRow() < this.postIts.length) {
          this.documentComponents.toArray()[selector.documentIdx + this.documentsPerRow()].select(selector.column, 0);
        }
        break;
    }
  }

  private documentsPerRow(): number {
    return Math.floor(this.layoutElement.nativeElement.clientWidth / (215 /*Post-it width*/ + this.layoutGutter));
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

    this.fetchingData = true;
    this.setInfiniteScroll(false);

    this.searchService.searchDocuments(this.queryPage(this.page)).pipe(
      finalize(() => {
        this.fetchingData = false;
        this.setInfiniteScroll(true);
        this.page++;
      })
    ).subscribe(
      documents => this.fetchDocumentData(documents),
      error => this.notificationService.error('Failed fetching documents')
    );
  }

  private fetchDocumentData(documents: Document[]): void {
    documents.forEach(document => this.postIts.push(this.documentToPostIt(document, true)));

    const uniqueCollectionCodes = new Set(documents.map(document => document.collectionCode));
    this.fetchCollections(uniqueCollectionCodes);
  }

  private documentToPostIt(document: Document, initialized: boolean): DocumentData {
    const postIt = new DocumentData;
    postIt.document = document;
    postIt.selectedInput = this.selectedAttributeProperty();
    postIt.initialized = initialized;
    postIt.visible = false;

    return postIt;
  }

  private fetchCollections(collectionCodes: Set<string>): void {
    let fetchedCollections = 0;
    const countAsFetched = () => {
      fetchedCollections++;

      if (fetchedCollections === collectionCodes.size) {
        this.refresh();
      }
    };

    collectionCodes.forEach(collectionCode => {
      if (this.collections[collectionCode]) {
        countAsFetched();
        return;
      }

      this.collectionService.getCollection(collectionCode).pipe(
        finalize(() => countAsFetched())
      ).subscribe(
        collection => this.registerCollection(collection),
        error => this.notificationService.error(`Failed fetching collection ${collectionCode}`)
      );
    });
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

  public toggleDocumentFavorite(postIt: DocumentData) {
    this.documentService.toggleDocumentFavorite(postIt.document)
      .subscribe(success => {
        if (success) {
          postIt.document.isFavorite = !postIt.document.isFavorite;
        }
      });
  }

  public sendUpdate(postIt: DocumentData): void {
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

  private initializePostIt(postIt: DocumentData): void {
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

  private refreshDocument(postIt: DocumentData): void {
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

  public removeDocument(postIt: DocumentData): void {
    if (postIt.initialized) {
      this.documentService.removeDocument(postIt.document).subscribe(
        response => null,
        error => this.notificationService.error('Failed removing document')
      );
    }

    this.postIts.splice(postIt.index, 1);
    this.refresh();
  }

  private refresh(): void {
    for (let i = 0; i < this.postIts.length; i++) {
      this.postIts[i].index = i;
    }

    this.layout.refresh();

    setTimeout(() => {
      this.postIts.filter(postIt => this.collections[postIt.document.collectionCode])
        .forEach(postIt => postIt.visible = true);
    });
  }

  public confirmDeletion(postIt: DocumentData): void {
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
    // might get called before onInit finishes
    if (this.layout) {
      this.layout.destroy();
    }
    this.setInfiniteScroll(false);
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }

}
