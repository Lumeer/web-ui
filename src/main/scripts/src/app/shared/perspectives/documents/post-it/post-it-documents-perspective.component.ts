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

  @Input()
  public editable: boolean;

  @Input()
  public height: string = '500px';

  public collection: Collection;

  public addDocumentAttribute: string;
  public addButtonColor: string;
  public cursorOnAddButton: boolean;

  public documents: Document[];

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.initializeWorkspace();
    this.fetchDocuments();
  }

  public initializeWorkspace(): void {
    if (!this.workspaceService.isWorkspaceSet()) {
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.workspaceService.projectCode = params.get('projectCode');
        this.workspaceService.organizationCode = params.get('organizationCode');
      });
    }
  }

  public fetchDocuments(): void {
    this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .switchMap(collection => {
        this.collection = collection;
        return this.documentService.getDocuments(collection.code);
      })
      .subscribe(documents => this.documents = documents);
  }

  public hasText(str: string): boolean {
    return str && str !== '';
  }

  public higherBy(base: string, ammount: number): string {
    let units: string = base.replace(/\d+/, '');
    let height: number = Number(base.replace(/[^\d]+/, ''));

    return `${height + ammount}${units}`;
  }

  public increaseBlockHeight(): void {
    this.height = this.higherBy(this.height, 450);
  }

  public setCursorOnAddButton(on: boolean): void {
    this.cursorOnAddButton = on;
    this.checkAddButtonColor();
  };

  public checkAddButtonColor() {
    let activeColor = '#18bc9c';
    let enabledColor = '#2c3e50';
    let disabledColor = '#cccccc';

    if (this.cursorOnAddButton && this.hasText(this.addDocumentAttribute)) {
      this.addButtonColor = activeColor;
      return;
    }

    if (this.hasText(this.addDocumentAttribute)) {
      this.addButtonColor = enabledColor;
      return;
    }

    this.addButtonColor = disabledColor;
  }

  public createDocument(): void {
    if (!this.hasText(this.addDocumentAttribute)) {
      return;
    }

    let document = new Document();
    document.put('New Attribute', this.addDocumentAttribute);

    this.documents.unshift(document);
    this.documentService.createDocument(this.collection.code, document);
    this.addDocumentAttribute = '';
  }

  public saveDocument(changedDocument: Document): void {
    this.documentService.updateDocument(this.collection.code, changedDocument);
  }

}
