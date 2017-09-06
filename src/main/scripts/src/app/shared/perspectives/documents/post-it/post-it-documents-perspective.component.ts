/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {Query} from '../../../../core/dto/query';
import {Document} from '../../../../core/dto/document';
import {Collection} from '../../../../core/dto/collection';
import {Perspective} from '../../perspective';
import {DocumentService} from '../../../../core/rest/document.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {AttributePropertySelection} from './document-data/attribute-property-selection';
import {Direction} from './document-data/direction';
import {SearchService} from '../../../../core/rest/search.service';
import {PostItLayout} from '../../utils/post-it-layout';
import {Buffer} from '../../utils/buffer';
import {DocumentData} from './document-data/document-data';
import {Role} from '../../../permissions/role';
import {Permission} from '../../../../core/dto/permission';
import {isNullOrUndefined} from 'util';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss']
})
export class PostItDocumentsPerspectiveComponent implements Perspective, OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean = true;

  @Input()
  public height = 500;

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChildren(PostItDocumentComponent)
  public documentComponents: QueryList<PostItDocumentComponent>;

  public documentDataObjects: DocumentData[] = [];

  private updatingDocument: DocumentData;

  private updateBuffer: Buffer;

  private layout: PostItLayout;

  private collections: { [collectionCode: string]: Collection } = {};

  private attributeSuggestions: { [collectionCode: string]: string[] } = {};

  private page = 0;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private modalService: NgbModal) {
  }

  public ngOnInit(): void {
    this.initializeLayout();
    this.fetchData();
  }

  public ngAfterViewChecked(): void {
    this.layout.refresh();
  }

  public attributeSuggestionsEntries(): [string, string[]][] {
    return Object.entries(this.attributeSuggestions);
  }

  private selectedAttributeProperty(): AttributePropertySelection {
    return this.documentDataObjects[0] ? this.documentDataObjects[0].selectedInput : this.emptySelection();
  }

  private emptySelection(): AttributePropertySelection {
    return {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: Direction.Self,
      editing: false
    };
  }

  public selectDocument(selector: AttributePropertySelection): void {
    switch(selector.direction) {
      case Direction.Left:
        if (selector.documentIdx - 1 >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - 1].select(Number.MAX_SAFE_INTEGER, selector.row);
        }
        break;

      case Direction.Right:
        if (selector.documentIdx + 1 < this.documentDataObjects.length) {
          this.documentComponents.toArray()[selector.documentIdx + 1].select(0, selector.row);
        }
        break;

      case Direction.Up:
        if (selector.documentIdx - this.documentsPerRow() >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - this.documentsPerRow()].select(selector.column, Number.MAX_SAFE_INTEGER);
        }
        break;

      case Direction.Down:
        if (selector.documentIdx + this.documentsPerRow() < this.documentDataObjects.length) {
          this.documentComponents.toArray()[selector.documentIdx + this.documentsPerRow()].select(selector.column, 0);
        }
        break;
    }
  }

  private documentsPerRow(): number {
    return Math.floor(this.layoutElement.nativeElement.clientWidth / (220 /*Post-it width*/ + 10 /*Gutter*/));
  }

  private initializeLayout(): void {
    this.layout = new PostItLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 10
    });
  }

  private queryPage(pageNumber: number): Query {
    return {
      pageSize: this.documentsPerRow() * 2,
      page: pageNumber,
      filters: this.query.filters,
      fulltext: this.query.fulltext,
      collections: this.query.collections
    };
  }

  private fetchData(): void {
    this.searchService.searchDocuments(this.queryPage(this.page++))
      .retry(3)
      .subscribe(
        documents => {
          this.initializeFetchedDocuments(documents);
        },
        error => {
          this.handleError(error, 'Failed fetching documents');
        }
      );
  }

  private initializeFetchedDocuments(documents: Document[]): void {
    const selection = this.selectedAttributeProperty();

    documents.forEach(docuent => {
      const documentData = new DocumentData;
      documentData.document = docuent;
      documentData.selectedInput = selection;

      this.fetchCollectionData(documentData);
      this.documentDataObjects.push(documentData);
    });

    this.refreshIndexes();
  }

  private fetchCollectionData(documentData: DocumentData): void {
    const collectionCode = documentData.document.collectionCode;

    if (this.collections[collectionCode]) {
      this.initializeAttributeSuggestions(this.collections[collectionCode]);
      return;
    }

    if (this.collections[collectionCode] === null) {
      return;
    }

    this.collections[collectionCode] = null;
    this.collectionService.getCollection(collectionCode)
      .retry(3)
      .subscribe(
        collection => {
          this.collections[collectionCode] = collection;
          this.initializeAttributeSuggestions(collection);
        },
        error => {
          this.notificationService.error('Error', 'Failed fetching collection data');
        }
      );
  }

  private async initializeAttributeSuggestions(collection: Collection): Promise<void> {
    if (await this.getAttributeSuggestions(collection.code)) {
      // initialize all documentDataObjects with current collection only once
      // collection and attributeSuggestions are already present
      this.finalizeInitialization(collection);
    }
  }

  private finalizeInitialization(collection: Collection): void {
    this.documentDataObjects
      .filter(documentData => documentData.document.collectionCode === collection.code)
      .forEach(documentData => {
        documentData.collection = this.collections[documentData.document.collectionCode];
        documentData.attributes = this.attributeSuggestions[documentData.document.collectionCode];
        documentData.writeRole = this.hasWriteRole(collection);
        documentData.initialized = true;
      });
  }

  public async createDocument(document: Document) {
    const newDocumentDataObject = new DocumentData;
    newDocumentDataObject.document = document;
    newDocumentDataObject.collection = await this.getCollection(document.collectionCode);
    newDocumentDataObject.attributes = await this.getAttributeSuggestions(document.collectionCode);
    newDocumentDataObject.writeRole = this.hasWriteRole(newDocumentDataObject.collection);
    newDocumentDataObject.selectedInput = this.selectedAttributeProperty();
    newDocumentDataObject.initialized = false;

    this.documentDataObjects.unshift(newDocumentDataObject);
    this.refreshIndexes();
  }

  private async getCollection(collectionCode: string): Promise<Collection> {
    if (this.hasCollection(collectionCode)) {
      return this.collections[collectionCode];
    }

    return this.collectionService.getCollection(collectionCode)
      .toPromise<Collection>()
      .then(collection => this.collections[collectionCode] = collection);
  }

  private hasCollection(collectionCode: string): boolean {
    return !isNullOrUndefined(this.collections[collectionCode]);
  }

  private async getAttributeSuggestions(collectionCode: string): Promise<string[]> {
    if (this.attributeSuggestions[collectionCode]) {
      return this.attributeSuggestions[collectionCode];
    }

    if (this.attributeSuggestions[collectionCode] === null) {
      return null;
    }

    this.attributeSuggestions[collectionCode] = null;
    await this.getCollection(collectionCode).then(collection => {
      this.attributeSuggestions[collectionCode] = collection.attributes
        .sort((attribute1, attribute2) => attribute2.usageCount - attribute1.usageCount) // descending order
        .map(attribute => attribute.name);
    });

    return this.attributeSuggestions[collectionCode];
  }

  public sendUpdate(documentDataObject: DocumentData): void {
    if (this.updatingDocument === documentDataObject) {
      this.updateBuffer.stageChanges();
      return;
    }

    if (!documentDataObject.initialized) {
      this.initializeDocument(documentDataObject);
      return;
    }

    this.updatingDocument = documentDataObject;
    this.updateBuffer = new Buffer(() => {
      this.documentService.updateDocument(documentDataObject.document)
        .retry(3)
        .subscribe(
          document => {
            documentDataObject.document.data = document.data;
          },
          error => {
            this.handleError(error, 'Failed updating document');
          });
    }, 750);
  }

  private initializeDocument(documentDataObject: DocumentData): void {
    this.documentService.createDocument(documentDataObject.document)
      .retry(3)
      .subscribe(
        response => {
          documentDataObject.document.id = response.headers.get('Location').split('/').pop();

          this.refreshDocument(documentDataObject);
          documentDataObject.initialized = true;
          this.notificationService.success('Success', 'Document Created');
        },
        error => {
          this.handleError(error, 'Failed creating document');
        });
  }

  private refreshDocument(documentDataObject: DocumentData): void {
    this.documentService.getDocument(documentDataObject.document.collectionCode, documentDataObject.document.id)
      .retry(3)
      .subscribe(
        document => {
          documentDataObject.document = document;
        },
        error => {
          this.handleError(error, 'Refreshing document failed');
        });
  }

  public removeClick(documentDataObject: DocumentData, popup: ElementRef) {
    this.modalService.open(popup).result.then(
      closed => {
        this.removeDocument(documentDataObject);
      }, dismissed => {
        return null;
      }
    );
  }

  public removeDocument(documentDataObject: DocumentData): void {
    if (documentDataObject.initialized) {
      this.documentService.removeDocument(documentDataObject.document)
        .retry(3)
        .subscribe(
          response => {
            this.notificationService.success('Success', 'Document removed');
          },
          error => {
            this.notificationService.error('Error', 'Failed removing document');
          });
    }

    this.documentDataObjects.splice(documentDataObject.index, 1);
    this.refreshIndexes();
  }

  private refreshIndexes(): void {
    for (let i = 0; i < this.documentDataObjects.length; i++) {
      this.documentDataObjects[i].index = i;
    }
  }

  public hasWriteRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.WRITE);
  }

  private hasRole(collection: Collection, role: string): boolean {
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  private handleError(error: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
  }

  public loadMore(perspective: HTMLDivElement): void {
    if (perspective.scrollHeight - perspective.scrollTop === perspective.clientHeight) {
      this.fetchData();
    }
  }

  public onScrollDown(perspective: HTMLDivElement): void {
    $(perspective).animate({
      scrollTop: perspective.scrollHeight
    });
  }

  public ngOnDestroy(): void {
    this.layout.destroy();
  }

}
