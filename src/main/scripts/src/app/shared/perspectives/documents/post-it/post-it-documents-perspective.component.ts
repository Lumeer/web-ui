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
import {Perspective} from '../../perspective';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss'],
  animations: [
    trigger('appear', [
      transition(':enter', [
        style({transform: 'scale(0)'}),
        animate('0.25s ease-out', style({transform: 'scale(1)'})),
      ]),
      transition(':leave', [
        style({transform: 'scale(1)'}),
        animate('0.25s ease-out', style({transform: 'scale(0)'})),
      ])
    ])
  ]
})
export class PostItDocumentsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: string;

  // TODO REMOVE
  @Input()
  public editable: boolean = true;

  @Input()
  public height: string = '500px';

  public collection: Collection;

  public attributes: string[];

  public documents: Document[];

  /**
   * To prevent sending data after each data change, the timer provides 'buffering', by waiting a while after each change before sending
   */
  private restTimeout: number;
  private timeoutFunction: () => void;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.initializeWorkspace();
    this.fetchCollections();
    this.fetchAttributes();
  }

  public initializeWorkspace(): void {
    if (!this.workspaceService.isWorkspaceSet()) {
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.workspaceService.projectCode = params.get('projectCode');
        this.workspaceService.organizationCode = params.get('organizationCode');
      });
    }
  }

  public fetchCollections(): void {
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
      .subscribe(documents => this.documents = documents);
  }

  public fetchAttributes(): void {
    this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getAttributes(collectionCode))
      .subscribe(attributes => this.attributes = attributes);
  }

  /**
   * @returns {string} Increases base (123px) by ammount (7) => 130px
   */
  public higherBy(base: string, ammount: number): string {
    let units: string = base.replace(/\d+/, '');
    let height: number = Number(base.replace(/[^\d]+/, ''));

    return `${height + ammount}${units}`;
  }

  /**
   * Increases height of the perspective by 450 pixels
   */
  public increaseBlockHeight(): void {
    this.height = this.higherBy(this.height, 450);
  }

  public createDocument(): void {
    this.flushTimer();

    let newDocument = new Document;
    this.documents.unshift(newDocument);
    this.documentService.createDocument(this.collection.code, newDocument);
  }

  public removeDocument(idx: number): void {
    this.flushTimer();

    let deletedDocument = this.documents[idx];
    this.documents.splice(idx, 1);
    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  public addAttribute(attr: { attribute: string, value: any }, document: Document): void {
    if (attr.value !== '') {
      document.data[attr.attribute] = attr.value;
    } else {
      delete document.data[attr.attribute];
    }

    this.updateDocument(document);
  }

  public addNewAttribute(attr: { previousValue: string, value: string }, document: Document): void {
    delete document.data[attr.previousValue];

    if (attr.value !== '') {
      document.data[attr.value] = '';
    } else {
      delete document.data[attr.value];
    }

    this.updateDocument(document);
  }

  public updateDocument(document: Document): void {
    clearTimeout(this.restTimeout);
    this.timeoutFunction = () => {
      document.version += 1;
      this.documentService.updateDocument(this.collection.code, document);
      this.timeoutFunction = null;
    };
    this.restTimeout = window.setTimeout(this.timeoutFunction, 3000);
  }

  /**
   * Stops timer and executes it's function if it wasn't executed already
   */
  private flushTimer(): void {
    if (this.timeoutFunction) {
      clearTimeout(this.restTimeout);
      this.timeoutFunction();
      this.timeoutFunction = null;
    }
  }

}
