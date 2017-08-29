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

import {ActivatedRoute} from '@angular/router';
import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';

import {Perspective} from '../../perspective';
import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {Attribute} from '../../../../core/dto/attribute';
import {DocumentService} from '../../../../core/rest/document.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {AttributePropertySelection} from './attribute/attribute-property-selection';
import {Direction} from './attribute/direction';
import {MasonryLayout} from '../../utils/masonry-layout';
import {Buffer} from '../../utils/buffer';
import {Observable} from 'rxjs/Rx';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss']
})
export class PostItDocumentsPerspectiveComponent implements Perspective, OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: string;

  @Input()
  public editable: boolean = true;

  @Input()
  public height = 500;

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChildren(PostItDocumentComponent)
  public documentComponents: QueryList<PostItDocumentComponent>;

  public collection: Collection;

  public attributes: Attribute[] = [];

  public documents: Document[] = [];

  public initialized: boolean[] = [];

  public selection: AttributePropertySelection;

  public previousSelection: AttributePropertySelection;

  private updateBuffer: Buffer;

  private updatingDocument: Document;

  private layout: MasonryLayout;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private notificationService: NotificationsService,
              private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.initializeVariables();
    this.fetchData();
  }

  private initializeVariables(): void {
    this.collection = {
      code: '',
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON,
      documentCount: 0
    };

    this.selection = {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: Direction.Self,
      editing: false,
    };

    this.previousSelection = {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: Direction.Self,
      editing: false,
    };

    this.layout = new MasonryLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 15
    });
  }

  private fetchData(): void {
    this.route.paramMap
      .switchMap(paramMap => {
        let collectionCode = paramMap.get('collectionCode');
        return Observable.combineLatest(
          this.collectionService.getCollection(collectionCode),
          this.collectionService.getAttributes(collectionCode),
          this.documentService.getDocuments(collectionCode)
        );
      }).subscribe(([collection, attributes, documents]) => {
      this.collection = collection;
      this.attributes = attributes;
      this.documents = documents;
      this.initialized = new Array(documents.length).fill(true);
    });
  }

  public ngAfterViewChecked(): void {
    this.layout.refresh();
  }

  public selectDocument(selector: AttributePropertySelection): void {
    switch (selector.direction) {
      case Direction.Left:
        if (selector.documentIdx - 1 >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - 1].select(Number.MAX_SAFE_INTEGER, selector.row);
        }
        break;

      case Direction.Right:
        if (selector.documentIdx + 1 < this.documents.length) {
          this.documentComponents.toArray()[selector.documentIdx + 1].select(0, selector.row);
        }
        break;

      case Direction.Up:
        if (selector.documentIdx - this.documentsPerRow() >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - this.documentsPerRow()].select(selector.column, Number.MAX_SAFE_INTEGER);
        }
        break;

      case Direction.Down:
        if (selector.documentIdx + this.documentsPerRow() < this.documents.length) {
          this.documentComponents.toArray()[selector.documentIdx + this.documentsPerRow()].select(selector.column, 0);
        }
        break;
    }
  }

  private documentsPerRow(): number {
    return Math.floor(this.layoutElement.nativeElement.clientWidth / (290 /*Post-it width*/ + 15 /*Gutter*/));
  }

  public createDocument(): void {
    let newDocument = new Document;
    this.documents.unshift(newDocument);
    this.initialized.unshift(false);
  }

  public removeDocument(index: number): void {
    let deletedDocument = this.documents[index];

    if (this.initialized[index]) {
      this.documentService.removeDocument(this.collection.code, deletedDocument)
        .subscribe(
          _ => this.notificationService.success('Success', 'Document removed'),
          error => this.notificationService.error('Error', 'Failed removing document'));
    }

    this.documents.splice(index, 1);
    this.initialized.splice(index, 1);
  }

  public sendUpdate(index: number): void {
    let document = this.documents[index];

    if (this.updatingDocument === document) {
      this.updateBuffer.stageChanges();
    } else {
      this.updatingDocument = document;
      this.updateBuffer = new Buffer(() => {
        // replace is used until a version using: update and dropDocumentAttribute is implemented
        this.documentService.replaceDocument(this.collection.code, document)
          .subscribe(null, error => this.handleError(error, 'Failed updating document'));
        document.version += 1;
      }, 2000);

      if (!this.initialized[index]) {
        this.initializeDocument(index);
      }
    }
  }

  private initializeDocument(index: number): void {
    let document = this.documents[index];
    this.documentService.createDocument(this.collection.code, document)
      .subscribe(
        (json: object) => {
          document.id = json['_id'];

          this.initialized[index] = true;
          this.notificationService.success('Success', 'Document Created');
        },
        error => {
          this.handleError(error, 'Failed creating document');
        });
  }

  private handleError(error: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
  }

  public onSeeMore(perspective: HTMLDivElement): void {
    $(perspective).animate({
      scrollTop: perspective.scrollHeight
    });
  }

  public ngOnDestroy(): void {
    this.layout.destroy();
  }

}
