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
import {AfterViewChecked, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {Attribute} from '../../../../core/dto/attribute';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {Perspective} from '../../perspective';
import {Buffer} from '../../../../utils/buffer';
import {Observable} from 'rxjs/Rx';
import {AttributePropertySelection} from './attribute/attribute-property-selection';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss']
})
export class PostItDocumentsPerspectiveComponent implements Perspective, OnInit, AfterViewChecked {

  @Input()
  public query: string;

  @Input()
  public editable: boolean = true;

  @Input()
  public height = 500;

  @ViewChild('layout')
  public layout: ElementRef;

  @ViewChildren(PostItDocumentComponent)
  public documentComponents: QueryList<PostItDocumentComponent>;

  public collection: Collection;

  public attributes: Attribute[];

  public documents: Document[];

  public selection: AttributePropertySelection;

  public previousSelection: AttributePropertySelection;

  private updateBuffer: Buffer;

  private updatingDocument: Document;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.initializeVariables();
    this.initializeLayout();
    this.fetchData();
  }

  private initializeVariables(): void {
    this.collection = {
      code: '',
      name: 'No collection',
      color: '#cccccc',
      icon: 'fa-question',
      documentCount: 0
    };

    this.selection = {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: '',
      editing: false,
    };

    this.previousSelection = {
      row: undefined,
      column: undefined,
      documentIdx: undefined,
      direction: '',
      editing: false,
    };

    this.attributes = [];
    this.documents = [];
  }

  private initializeLayout() {
    let windowResizeRefreshBuffer = new Buffer(() => this.refreshLayout(), 200);
    window.addEventListener('resize', () => windowResizeRefreshBuffer.stageChanges());
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
    });
  }

  public ngAfterViewChecked(): void {
    this.refreshLayout();
  }

  private refreshLayout(): void {
    let Minigrid = window['Minigrid'];
    new Minigrid({
      container: '.layout',
      item: '.layout-item',
      gutter: 15
    }).mount();
  }

  public selectDocument(selector: AttributePropertySelection): void {
    switch (selector.direction) {
      case 'Left':
        if (selector.documentIdx - 1 >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - 1].select(Number.MAX_SAFE_INTEGER, selector.row);
        }
        break;

      case 'Right':
        if (selector.documentIdx + 1 < this.documents.length) {
          this.documentComponents.toArray()[selector.documentIdx + 1].select(0, selector.row);
        }
        break;

      case 'Up':
        if (selector.documentIdx - this.documentsPerRow() >= 0) {
          this.documentComponents.toArray()[selector.documentIdx - this.documentsPerRow()].select(selector.column, Number.MAX_SAFE_INTEGER);
        }
        break;

      case 'Down':
        if (selector.documentIdx + this.documentsPerRow() < this.documents.length) {
          this.documentComponents.toArray()[selector.documentIdx + this.documentsPerRow()].select(selector.column, 0);
        }
        break;
    }
  }

  private documentsPerRow(): number {
    return Math.floor(this.layout.nativeElement.clientWidth / (290 /*Post-it width*/ + 15 /*Gutter*/));
  }

  public createDocument(): void {
    let newDocument = new Document;
    this.documents.unshift(newDocument);

    this.documentService.createDocument(this.collection.code, newDocument);
  }

  public removeDocument(index: number): void {
    let deletedDocument = this.documents[index];
    this.documents.splice(index, 1);

    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  public sendUpdate(document: Document): void {
    if (this.updatingDocument === document) {
      this.updateBuffer.stageChanges();
    } else {
      this.updatingDocument = document;
      this.updateBuffer = new Buffer(() => {
        // replace is used until a version using: update and dropDocumentAttribute is implemented
        this.documentService.replaceDocument(this.collection.code, document);
        document.version += 1;
      }, 2000);
    }
  }

  public onSeeMore(perspective: HTMLDivElement): void {
    $(perspective).animate({
      scrollTop: perspective.scrollHeight
    });
  }

}
