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

import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';
import {Perspective} from '../../perspective';
import {Query} from '../../../../core/dto/query';
import {Document} from '../../../../core/dto/document';
import {DocumentService} from '../../../../core/rest/document.service';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {AttributePropertySelection} from './attribute/attribute-property-selection';
import {MasonryLayout} from '../../utils/masonry-layout';
import {Direction} from './attribute/direction';
import {Buffer} from '../../utils/buffer';
import {SearchService} from '../../../../core/rest/search.service';
import {ActivatedRoute} from '@angular/router';

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

  public collectionCode: string;

  public documents: Document[] = [];

  public initialized: boolean[] = [];

  public transitions = true;

  public selection: AttributePropertySelection;

  private updateBuffer: Buffer;

  private updatingDocument: Document;

  private layout: MasonryLayout;

  constructor(private documentService: DocumentService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.initializeSelection();
    this.initializeLayout();
    this.fetchData();
  }

  private initializeSelection(): void {
    this.selection = {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: Direction.Self,
      editing: false,
    };
  }

  private initializeLayout(): void {
    this.layout = new MasonryLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 15
    });
  }

  private fetchData(): void {
    if (this.editable) {
      this.route.paramMap.subscribe(paramMap => this.collectionCode = paramMap.get('collectionCode'));
    }

    this.searchService.searchDocuments(this.query).subscribe(
      documents => {
        this.documents = documents;
        this.initialized = new Array(documents.length).fill(true);
      },
      error => {
        this.handleError(error, 'Failed fetching documents');
      }
    );
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
    newDocument.collectionCode = this.collectionCode;

    this.documents.unshift(newDocument);
    this.initialized.unshift(false);
  }

  private initializeDocument(index: number, document: Document): void {
    this.documentService.createDocument(document.collectionCode, document).subscribe(
      response => {
        document.id = response.headers.get('Location').split('/').pop();

        // this.refreshDocument(index, document);
        this.initialized[index] = true;
        this.notificationService.success('Success', 'Document Created');
      },
      error => {
        this.handleError(error, 'Failed creating document');
      });
  }

  private refreshDocument(index: number, document: Document): void {
    this.documentService.getDocument(document.collectionCode, document.id).subscribe(
      document => {
        this.transitions = false;
        this.documents[index] = document;
        setTimeout(() => this.transitions = true, 400);
      },
      error => {
        this.handleError(error, 'Refreshing document failed');
      });
  }

  public removeDocument(index: number, document: Document): void {
    if (this.initialized[index]) {
      this.documentService.removeDocument(document.collectionCode, document)
        .subscribe(
          _ => {
            this.notificationService.success('Success', 'Document removed');
          },
          error => {
            this.notificationService.error('Error', 'Failed removing document');
          });
    }

    this.documents.splice(index, 1);
    this.initialized.splice(index, 1);
  }

  public sendUpdate(index: number, document: Document): void {
    if (this.updatingDocument === document) {
      this.updateBuffer.stageChanges();
    } else {
      this.updatingDocument = document;
      this.updateBuffer = new Buffer(() => {
        this.documentService.updateDocument(document.collectionCode, document).subscribe(
          document => {
            return null;
          },
          error => {
            this.handleError(error, 'Failed updating document');
          });
      }, 750);
      if (!this.initialized[index]) {
        this.initializeDocument(index, document);
      }
    }
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
