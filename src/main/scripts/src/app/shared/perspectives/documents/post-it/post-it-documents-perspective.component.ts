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
import {AfterViewChecked, Component, Input, OnInit} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Document} from '../../../../core/dto/document';
import {Attribute} from '../../../../core/dto/attribute';
import {AttributePair} from './attribute/attribute-pair';
import {AttributePropertyInput} from './attribute/attribute-property-input';
import {Perspective} from '../../perspective';
import {Buffer} from '../../../../utils/buffer';
import {Observable} from 'rxjs/Rx';

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

  public collection: Collection;

  public attributes: Attribute[];

  public documents: Document[];

  public selectedInput: AttributePropertyInput;

  private updateBuffer: Buffer;

  private previouslyEditedDocument: Document;

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

    this.selectedInput = {
      property: 'attribute',
      row: 0,
      column: 0,
      editing: false,
      inputElement: null,
      blockElement: null,
    };

    this.attributes = [];
    this.documents = [];
  }

  private initializeLayout() {
    window.addEventListener('resize', () => this.refreshLayout());
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
      this.attributes = attributes;
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

  public createDocument(): void {
    this.updateBuffer && this.updateBuffer.flush();

    let newDocument = new Document;
    this.documents.unshift(newDocument);

    this.documentService.createDocument(this.collection.code, newDocument);
  }

  public removeDocument(index: number): void {
    this.updateBuffer && this.updateBuffer.flush();

    let deletedDocument = this.documents[index];
    this.documents.splice(index, 1);

    this.documentService.removeDocument(this.collection.code, deletedDocument);
  }

  public onAttributePairChange(document: Document, attributePair: AttributePair): void {
    delete document.data[attributePair.previousAttributeName];

    if (attributePair.attribute) {
      document.data[attributePair.attribute] = attributePair.value;
    } else {
      delete document.data[attributePair.attribute];
    }

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

  public onSeeMore(layout: HTMLDivElement): void {
    $(layout).animate({
      scrollTop: layout.scrollHeight
    });
  }

}
