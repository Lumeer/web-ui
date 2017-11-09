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

import {AfterViewChecked, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

import {PostItDocumentComponent} from './document/post-it-document.component';
import {AttributePropertySelection} from './document-data/attribute-property-selection';
import {Direction} from './document-data/direction';
import {DocumentData} from './document-data/document-data';
import {Query} from '../../../core/dto/query';
import {PostItLayout} from '../../../shared/utils/post-it-layout';
import {Collection} from '../../../core/dto/collection';
import {DocumentService} from 'app/core/rest/document.service';
import {SearchService} from 'app/core/rest/search.service';
import {CollectionService} from '../../../core/rest/collection.service';
import {Document} from '../../../core/dto/document';
import {Permission} from 'app/core/dto/permission';
import {Role} from '../../../shared/permissions/role';
import {PerspectiveComponent} from '../perspective.component';
import {isNullOrUndefined} from 'util';
import {finalize} from 'rxjs/operators';
import {Perspective} from '../perspective';

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItPerspectiveComponent implements PerspectiveComponent, OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public config: any;

  @Input()
  public editable: boolean = true;

  @Input()
  public height = 500;

  @ViewChild('perspective')
  public perspective: ElementRef;

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChildren(PostItDocumentComponent)
  public documentComponents: QueryList<PostItDocumentComponent>;

  public deleteConfirm: BsModalRef;

  public postItToDelete: DocumentData;

  public postIts: DocumentData[] = [];

  private layout: PostItLayout;

  public lastClickedPostIt: DocumentData;

  private collections: { [collectionCode: string]: Collection } = {};

  private attributeSuggestions: { [collectionCode: string]: string[] } = {};

  private page = 0;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private zone: NgZone,
              private modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.initializeLayout();
    this.fetchData();
  }

  public ngAfterViewChecked(): void {
    this.layout.refresh();
  }

  public extractConfig(): any {
    this.config[Perspective.PostIt.id] = null; // TODO save configuration
    return this.config;
  }

  public attributeSuggestionsEntries(): [string, string[]][] {
    return Object.entries(this.attributeSuggestions);
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
    return Math.floor(this.layoutElement.nativeElement.clientWidth / (215 /*Post-it width*/ + 10 /*Gutter*/));
  }

  private initializeLayout(): void {
    this.layout = new PostItLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 10
    }, this.zone);
  }

  private queryPage(pageNumber: number): Query {
    return {
      pageSize: this.documentsPerRow() * 2,
      page: pageNumber,
      filters: this.query.filters,
      fulltext: this.query.fulltext,
      collectionCodes: this.query.collectionCodes
    };
  }

  private fetchData(): void {
    this.searchService.searchDocuments(this.queryPage(this.page++))
      .subscribe(
        documents => {
          this.initializePostIts(documents);
        },
        error => {
          this.handleError(error, 'Failed fetching documents');
        }
      );
  }

  private initializePostIts(documents: Document[]): void {
    const selection = this.selectedAttributeProperty();

    documents.forEach(document => {
      const postIt = new DocumentData;
      postIt.document = document;
      postIt.selectedInput = selection;

      this.fetchCollection(postIt);
      this.postIts.push(postIt);
    });

    this.refreshIndexes();
  }

  private fetchCollection(postIt: DocumentData): void {
    const collectionCode = postIt.document.collectionCode;

    if (this.collections[collectionCode]) {
      this.initializeAttributeSuggestions(this.collections[collectionCode]);
      return;
    }

    if (this.collections[collectionCode] === null) {
      return;
    }

    this.collections[collectionCode] = null;
    this.collectionService.getCollection(collectionCode)
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
      // initialize all postIts with current collection only once
      // collection and attributeSuggestions are already present
      this.finalizeInitialization(collection);
    }
  }

  private finalizeInitialization(collection: Collection): void {
    this.postIts
      .filter(postIt => postIt.document.collectionCode === collection.code)
      .forEach(postIt => {
        postIt.collection = this.collections[postIt.document.collectionCode];
        postIt.attributes = this.attributeSuggestions[postIt.document.collectionCode];
        postIt.writeRole = this.hasWriteRole(collection);
        postIt.initialized = true;
      });
  }

  public async createDocument(document: Document) {
    const newPostIt = new DocumentData;
    newPostIt.document = document;
    newPostIt.collection = await this.getCollection(document.collectionCode);
    newPostIt.attributes = await this.getAttributeSuggestions(document.collectionCode);
    newPostIt.writeRole = this.hasWriteRole(newPostIt.collection);
    newPostIt.selectedInput = this.selectedAttributeProperty();
    newPostIt.initialized = false;

    this.postIts.unshift(newPostIt);
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

  public sendUpdate(postIt: DocumentData): void {
    if (postIt.initializing) {
      return;
    }

    if (!postIt.initialized) {
      this.initializePostIt(postIt);
      return;
    }

    this.documentService.updateDocument(postIt.document)
      .subscribe(
        document => {
          delete document.data['_id']; // TODO remove after _id is no longer sent inside data
          postIt.document.data = document.data;
        },
        error => {
          this.handleError(error, 'Failed updating document');
        });
  }

  private initializePostIt(postIt: DocumentData): void {
    postIt.initializing = true;

    this.documentService.createDocument(postIt.document).pipe(
      finalize(() => postIt.initializing = false)
    ).subscribe((id: string) => {
        postIt.initialized = true;

        postIt.document.id = id;
        this.refreshDocument(postIt);
        this.notificationService.success('Success', 'Document Created');
      },
      error => {
        this.handleError(error, 'Failed creating document');
      });
  }

  private refreshDocument(postIt: DocumentData): void {
    this.documentService.getDocument(postIt.document.collectionCode, postIt.document.id)
      .subscribe(
        document => {
          delete document.data['_id']; // TODO remove after _id is no longer sent inside data
          postIt.document = document;
        },
        error => {
          this.handleError(error, 'Refreshing document failed');
        });
  }

  public confirmDeletion(postIt: DocumentData, modal: TemplateRef<any>): void {
    this.postItToDelete = postIt;
    this.deleteConfirm = this.modalService.show(modal);
  }

  public removeDocument(postIt: DocumentData): void {
    if (postIt.initialized) {
      this.documentService.removeDocument(postIt.document)
        .subscribe(
          response => {
            this.notificationService.success('Success', 'Document removed');
          },
          error => {
            this.notificationService.error('Error', 'Failed removing document');
          });
    }

    this.postIts.splice(postIt.index, 1);
    this.refreshIndexes();
  }

  private refreshIndexes(): void {
    for (let i = 0; i < this.postIts.length; i++) {
      this.postIts[i].index = i;
    }
  }

  public hasWriteRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.Write);
  }

  private hasRole(collection: Collection, role: string): boolean {
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  private handleError(error: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
  }

  public showMore(perspective: HTMLDivElement): void {
    this.fetchData();

    perspective.scroll({
      top: perspective.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  }

  public onClick(event: MouseEvent): void {
    const clickedPostItIndex = this.documentComponents
      .toArray()
      .findIndex(postIt => postIt.element.nativeElement.contains(event.target));
    this.lastClickedPostIt = this.postIts[clickedPostItIndex];
  }

  public ngOnDestroy(): void {
    this.layout.destroy();
  }

}
