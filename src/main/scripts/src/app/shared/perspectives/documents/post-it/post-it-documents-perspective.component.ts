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
import {Component, ElementRef, Input, OnInit, QueryList, ViewChildren} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import {Perspective} from '../../perspective';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {isUndefined} from 'util';

@Component({
  selector: 'post-it-documents-perspective',
  templateUrl: './post-it-documents-perspective.component.html',
  styleUrls: ['./post-it-documents-perspective.component.scss'],
  host: {
    '(document:click)': 'toggleEditing($event)'
  },
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

  @ViewChildren('postItDocument')
  public documentElements: QueryList<ElementRef>;

  @ViewChildren('edit')
  public editSwitches: QueryList<ElementRef>;

  public collection: Collection;

  public addDocumentAttribute: string;
  public addButtonColor: string;
  public cursorOnAddButton: boolean;

  public documents: Document[];

  public documentAttributes: string[];

  public lastClickedDocument: number;
  public currentlyClickedDocument: number;

  constructor(private documentService: DocumentService,
              private collectionService: CollectionService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.initializeWorkspace();
    this.fetchCollections();
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
    this.route.paramMap
      .map(params => params.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .switchMap(collection => {
        this.collection = collection;
        return this.documentService.getDocuments(collection.code);
      })
      .subscribe(documents => this.documents = documents);
  }

  /**
   * @returns {boolean} string is defined and not empty
   */
  public hasText(str: string): boolean {
    return str && str !== '';
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

  public updateDocument(changedDocument: Document): void {
    this.documentService.updateDocument(this.collection.code, changedDocument);
  }

  public appendAttribute(document: Document, key: string, value: any): void {
    if (this.documentAttributes.indexOf(key) !== -1) {
      this.documentAttributes.push(key);
    }

  }

  public removeDocument(idx: number): void {
    this.documents.splice(idx, 1);
    this.documentService.removeDocument(this.collection.code, this.documents[idx]);
  }

  public getDocumentElement(idx: number): any {
    return this.documentElements.toArray()[idx].nativeElement;
  }

  public getEditSwitch(idx: number): any {
    return this.editSwitches.toArray()[idx].nativeElement;
  }

  /**
   * Toggles edit menu on/ off
   */
  public toggleEditing(event: MouseEvent): void {
    // havent selected document yet
    if (isUndefined(this.currentlyClickedDocument)) {
      return;
    }

    // dislable previous
    if (this.lastClickedDocument) {
      this.documents[this.lastClickedDocument].edited = false;
    }

    let document = this.documents[this.currentlyClickedDocument];

    // if clicked on editSwitch
    if (this.getEditSwitch(this.currentlyClickedDocument).contains(event.target)) {
      document.edited = !document.edited;
      return;
    }

    // if clicked on document
    if (this.getDocumentElement(this.currentlyClickedDocument).contains(event.target)) {
      return;
    }

    // click outside
    document.edited = false;
  }

  /**
   * Save indexes of currently and preciously clicked documents
   */
  public documentClick(idx: number): void {
    if (idx === this.currentlyClickedDocument) {
      return;
    }

    this.lastClickedDocument = this.currentlyClickedDocument;
    this.currentlyClickedDocument = idx;
  }

  /**
   * @returns {string} Color of background of edit button
   */
  public editBackground(document: Document): string {
    if (document.edited) {
      return '#E2E2E4';
    }

    if (document.underCursor) {
      return '#EFEFEF';
    }

    return 'transparent';
  }

  // TODO remove
  public log(s: string) {
    console.log(s);
  }
}
