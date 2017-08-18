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

import {animate, style, transition, trigger} from '@angular/animations';
import {ActivatedRoute} from '@angular/router';
import {Component, Input, OnInit} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {Attribute} from '../../../../core/dto/attribute';
import {AttributePair} from './document-attribute';
import {AttributePropertyInput} from './attribute-list/attribute-property-input';
import {Perspective} from '../../perspective';
import {MasonryLayout} from '../../../../utils/masonry-layout';
import {Buffer} from '../../../../utils/buffer';
import {Observable} from 'rxjs/Rx';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss'],
  animations: [
    trigger('appear', [
      transition(':enter', [
        style({transform: 'scale(0)'}),
        animate('0.25s ease-out', style({transform: 'scale(1)'}))
      ]),
      transition(':leave', [
        style({transform: 'scale(1)'}),
        animate('0.25s ease-out', style({transform: 'scale(0)'}))
      ])
    ])
  ]
})
export class PostItDocumentsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: string;

  @Input()
  public editable: boolean = true;

  @Input()
  public height = 500;

  public collection: Collection;

  public attributes: Attribute[];

  public documents: Document[];

  public selectedInput: AttributePropertyInput;

  private updateBuffer: Buffer;

  private layout: MasonryLayout;

  private previouslyEditedDocument: Document;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private route: ActivatedRoute) {
  }

  public documentId(index: number) {
    return `Document${index}`;
  }

  public ngOnInit(): void {
    this.setFallbackData();
    this.fetchData();
  }

  private setFallbackData(): void {
    this.collection = {
      code: '',
      name: 'No collection',
      color: '#cccccc',
      icon: 'fa-question',
      documentCount: 0
    };

    this.attributes = [];
    this.documents = [];
    this.selectedInput = {} as AttributePropertyInput;
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
      this.initializeLayout();
    });
  }

  private initializeLayout(): void {
    window.setImmediate(() => this.layout = new MasonryLayout({
      gutter: 15,
      stamp: '.grid-stamp',
      horizontalOrder: true,
      percentPosition: true
    }));
  }

  public createDocument(): void {
    this.updateBuffer && this.updateBuffer.flush();

    let newDocument = new Document;
    this.documents.unshift(newDocument);
    window.setImmediate(() => this.layout.prepend($(`#${this.documentId(0)}`)));

    this.documentService.createDocument(this.collection.code, newDocument);
  }

  public removeDocument(index: number): void {
    this.updateBuffer && this.updateBuffer.flush();

    let deletedDocument = this.documents[index];
    this.documents.splice(index, 1);
    window.setImmediate(() => this.layout.remove($(`#${this.documentId(index)}`)));

    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  public onAttributePairChange(document: Document, attributePair: AttributePair): void {
    delete document.data[attributePair.previousAttributeName];

    if (attributePair.attribute) {
      document.data[attributePair.attribute] = attributePair.value;
    } else {
      delete document.data[attributePair.attribute];
    }

    window.setImmediate(() => this.layout.refresh());
    this.updateDocument(document);
  }

  private updateDocument(document: Document): void {
    if (this.lastEditedDocument(document)) {
      this.updateBuffer.stageChanges();
    } else {
      this.updateBuffer && this.updateBuffer.flush();
      this.updateBuffer = new Buffer(() => {
        this.documentService.updateDocument(this.collection.code, document);
        document.version += 1;
      }, 2000);
    }

    this.previouslyEditedDocument = document;
  }

  private lastEditedDocument(document: Document): boolean {
    return this.previouslyEditedDocument && this.previouslyEditedDocument === document;
  }

}
