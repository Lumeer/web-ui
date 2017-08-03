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
import {isNullOrUndefined} from 'util';
import Timer = NodeJS.Timer;

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
  private restTimeout;

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

  public updateDocument(changedDocument: Document): void {
    // to prevent sending document that hasn't received ID yet
    if (isNullOrUndefined(changedDocument._id)) {
      return;
    }

    clearTimeout(this.restTimeout);
    this.restTimeout = setTimeout(this.documentService.updateDocument(this.collection.code, changedDocument), 1500);
  }

  public removeDocument(idx: number): void {
    clearTimeout(this.restTimeout);
    this.documents.splice(idx, 1);

    this.documentService.removeDocument(this.collection.code, this.documents[idx]);
  }

  public startPreview(): void {
    let newDocument = new Document;

    clearTimeout(this.restTimeout);
    this.documents.unshift(newDocument);

    this.documentService.createDocument(this.collection.code, newDocument);
  }

  public stopPreview(): void {
    clearTimeout(this.restTimeout);
    let deletedDocument = this.documents.shift();
    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  public attributePreview(attr: object): void {
    let changedDocument = this.documents[0];

    changedDocument.data[attr['attribute']] = attr['value'];
    this.updateDocument(changedDocument);
  }

  public newAttributePreview(attr: object): void {
    let changedDocument = this.documents[0];

    delete changedDocument.data[attr['previousValue']];
    changedDocument.data[attr['value']] = '';
    this.updateDocument(changedDocument);
  }

}
