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
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Component, Input, OnInit} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {Attribute} from '../../../../core/dto/attribute';
import {DocumentAttribute} from './document-attribute';
import {Perspective} from '../../perspective';

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

  public readonly MASONRY_GRID = 'grid';

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

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute) {
  }

  public generateId(index: number) {
    return `Document${index}`;
  }

  public ngOnInit() {
    this.initializeWorkspace();
    this.fetchCollections();
    this.fetchAttributes();
  }

  private initializeWorkspace(): void {
    if (!this.workspaceService.isWorkspaceSet()) {
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.workspaceService.projectCode = params.get('projectCode');
        this.workspaceService.organizationCode = params.get('organizationCode');
      });
    }
  }

  private fetchCollections(): void {
    // fallback, before subscription response
    this.collection = {
      code: '',
      name: 'No collection',
      color: '#cccccc',
      icon: 'fa-question',
      documentCount: 0
    };

    this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .switchMap(collection => {
        this.collection = collection;
        return this.documentService.getDocuments(collection.code);
      })
      .subscribe(documents => {
        this.documents = documents;
        this.initializeLayout();
      });
  }

  private fetchAttributes(): void {
    this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getAttributes(collectionCode))
      .subscribe(attributes => this.attributes = attributes);
  }

  private initializeLayout() {
    window.setTimeout(() => {
      $(`.${this.MASONRY_GRID}`)['masonry']({
        gutter: 15,
        stamp: `.${this.MASONRY_GRID}-stamp`,
        itemSelector: `.${this.MASONRY_GRID}-item`,
        columnWidth: `.${this.MASONRY_GRID}-item`,
        percentPosition: true
      });
    }, 50);
  }

  public increaseBlockHeight(): void {
    this.height += this.PERSPECTIVE_SEE_MORE_ADDED_HEIGHT;
  }

  public createDocument(): void {
    this.flushUpdateTimer();

    let newDocument = new Document;
    this.documents.push(newDocument);
    this.documentService.createDocument(this.collection.code, newDocument);

    this.moveDocumentToTheFront(this.documents.length - 1);
  }

  private moveDocumentToTheFront(index: number) {
    window.setTimeout(() => {
      $(`.${this.MASONRY_GRID}`)['masonry']('prepended', $(`#${this.generateId(index)}`));
    }, 50);
  }

  public removeDocument(index: number): void {
    this.flushUpdateTimer();

    this.removeFromLayout(index);

    let deletedDocument = this.documents[index];
    this.documents.splice(index, 1);
    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  private removeFromLayout(index: number) {
    window.setTimeout(() => {
      $(`.${this.MASONRY_GRID}`)['masonry']('remove', $(`#${this.generateId(index)}`)).masonry('layout');
    }, 50);
  }

  public addAttribute(document: Document, attribute: DocumentAttribute): void {
    delete document.data[attribute.previousName];

    if (attribute.value !== '') {
      document.data[attribute.name] = attribute.value;
    } else {
      delete document.data[attribute.name];
    }

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

      this.documentService.updateDocument(this.collection.code, document);
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
