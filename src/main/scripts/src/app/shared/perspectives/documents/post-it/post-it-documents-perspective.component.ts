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
import {Perspective} from '../../perspective';
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

  public readonly PERSPECTIVE_SEE_MORE_ADDED_HEIGHT = 400;

  public readonly PERSPECTIVE_OVERFLOW_BASE_HEIGHT = 200;

  public readonly PERSPECTIVE_BASE_HEIGHT = 450;

  @Input()
  public query: string;

  @Input()
  public editable: boolean;

  @Input()
  public height = this.PERSPECTIVE_BASE_HEIGHT;

  public collection: Collection;

  public attributes: Attribute[] = [];

  public documents: Document[] = [];

  /**
   * To prevent sending data after each data change, the timer provides 'buffering', by waiting a while after each change before sending
   */
  private updateTimer: number;

  private sendDocumentUpdate: () => void;

  private updatePending: boolean;

  private previouslyEditedDocument: Document;

  private layout: any;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private route: ActivatedRoute) {
  }

  public documentId(index: number) {
    return `Document${index}`;
  }

  public ngOnInit() {
    this.fetchData();
  }

  private fetchData() {
    Observable.combineLatest(
      this.getCollectionDocuments(),
      this.getAttributes()
    ).subscribe(data => {
      const [documents, attributes] = data;

      this.documents = documents;
      this.attributes = attributes;
      this.initializeLayout();
    });
  }

  private getCollectionDocuments(): Observable<Document[]> {
    // fallback, before subscription response
    this.collection = {
      code: '',
      name: 'No collection',
      color: '#cccccc',
      icon: 'fa-question',
      documentCount: 0
    };

    return this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .switchMap(collection => {
        this.collection = collection;
        return this.documentService.getDocuments(collection.code);
      });
  }

  private getAttributes(): Observable<Attribute[]> {
    return this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getAttributes(collectionCode));
  }

  private initializeLayout() {
    window.setTimeout(() => {
      this.layout = $('.grid')['masonry']({
        gutter: 15,
        stamp: '.grid-stamp',
        itemSelector: '.grid-item',
        columnWidth: '.grid-item',
        percentPosition: true
      });
    }, 50);
  }

  private moveDocumentToTheFront(index: number) {
    window.setTimeout(() => {
      this.layout.masonry('prepended', $(`#${this.documentId(index)}`));
    }, 0);
  }

  private removeFromLayout(index: number) {
    window.setTimeout(() => {
      this.layout.masonry('remove', $(`#${this.documentId(index)}`));
      this.refreshLayout();
    }, 0);
  }

  private refreshLayout() {
    this.layout.masonry('layout');
  }

  public increaseBlockHeight(): void {
    this.height += this.PERSPECTIVE_SEE_MORE_ADDED_HEIGHT;
  }

  public createDocument(): void {
    this.flushUpdateTimer();

    let newDocument = new Document;
    this.documents.push(newDocument);
    this.documentService.createDocument(this.collection.code, newDocument)
      .subscribe((json: object) => newDocument.id = json['_id']);

    this.moveDocumentToTheFront(this.documents.length - 1);
  }

  public removeDocument(index: number): void {
    this.flushUpdateTimer();

    this.removeFromLayout(index);

    let deletedDocument = this.documents[index];
    this.documents.splice(index, 1);
    this.documentService.removeDocument(this.collection.code, deletedDocument)
      .subscribe();
  }

  public onAttributePairChange(document: Document, attributePair: AttributePair): void {
    delete document.data[attributePair.previousAttributeName];

    if (attributePair.attribute) {
      document.data[attributePair.attribute] = attributePair.value;
    } else {
      delete document.data[attributePair.attribute];
    }

    this.refreshLayout();
    this.updateDocument(document);
  }

  private updateDocument(document: Document): void {
    this.resetTimer(document);

    this.previouslyEditedDocument = document;

    this.updatePending = true;
    this.sendDocumentUpdate = this.updateFunction(document);
    this.updateTimer = window.setTimeout(this.sendDocumentUpdate, 1500);
  }

  private resetTimer(document: Document): void {
    if (this.previouslyEditedDocument && this.previouslyEditedDocument !== document) {
      this.flushUpdateTimer();
    } else {
      clearTimeout(this.updateTimer);
    }
  }

  private updateFunction(document: Document): () => void {
    return () => {
      this.updatePending = false;

      this.documentService.updateDocument(this.collection.code, document)
        .subscribe();
      document.version += 1;
    };
  }

  private flushUpdateTimer(): void {
    if (this.updatePending) {
      clearTimeout(this.updateTimer);
      this.sendDocumentUpdate();
    }
  }
}
