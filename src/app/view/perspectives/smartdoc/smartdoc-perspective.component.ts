/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {DeltaOperation} from 'quill';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {first, map, skipWhile} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../core/store/collections/collections.action';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {CorrelationIdGenerator} from '../../../core/store/correlation-id.generator';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectAllDocuments} from '../../../core/store/documents/documents.state';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {SmartDocTemplateModel, SmartDocTemplatePartModel, SmartDocTemplatePartType} from '../../../core/store/smartdoc-templates/smartdoc-template.model';
import {SmartDocTemplatesAction} from '../../../core/store/smartdoc-templates/smartdoc-templates.action';
import {selectSmartDocTemplatesDictionary} from '../../../core/store/smartdoc-templates/smartdoc-templates.state';
import {SmartDocConfigModel, ViewConfigModel} from '../../../core/store/views/view.model';
import {ViewsAction} from '../../../core/store/views/views.action';
import {selectViewConfig, selectViewSmartDocConfig} from '../../../core/store/views/views.state';
import {SizeType} from '../../../shared/slider/size-type';
import {PerspectiveComponent} from '../perspective.component';

@Component({
  selector: 'template-perspective',
  templateUrl: './smartdoc-perspective.component.html',
  styleUrls: ['./smartdoc-perspective.component.scss']
})
export class SmartDocPerspectiveComponent implements PerspectiveComponent, OnChanges, OnInit, OnDestroy {

  @Input()
  public linkedDocument: DocumentModel;

  @Input()
  public query: QueryModel;

  @Input()
  public config: ViewConfigModel = {};

  @Input()
  public embedded: boolean;

  public templateId: string;
  private correlationId: string;

  public collections$: Observable<CollectionModel[]>;
  public documents$: Observable<DocumentModel[]>;
  public template$: Observable<SmartDocTemplateModel>;

  private querySubscription: Subscription;
  private configSubscription: Subscription;

  public size: SizeType = SizeType.M;

  public constructor(private store: Store<AppState>) {
    this.bindStoreData();
  }

  private bindStoreData() {
    this.collections$ = this.store.select(selectAllCollections);
    this.bindDocuments();
    this.bindTemplate();
  }

  private bindDocuments() {
    this.documents$ = Observable.combineLatest(
      this.store.select(selectAllDocuments),
      this.store.select(selectViewSmartDocConfig)
    ).pipe(
      map(([documents, smartDocConfig]) => ({documents: this.filterDocuments(documents), smartDocConfig})),
      map(({documents, smartDocConfig}) => {
        const config: SmartDocConfigModel = smartDocConfig || {templateId: null};
        const innerDocumentIdsOrder = config.innerDocumentIdsOrder || {};
        const documentIds: string[] = this.embedded ? innerDocumentIdsOrder[this.linkedDocument.id + this.templateId] : config.documentIdsOrder;
        return this.orderDocuments(documents, documentIds || []);
      })
    );
  }

  private filterDocuments(documents: DocumentModel[]): DocumentModel[] {
    return documents.filter(doc => {
      if (!this.query || !this.query.collectionCodes || !this.query.collectionCodes.includes(doc.collectionCode)) {
        return false;
      }

      return this.query.documentIds.length === 0 || this.query.documentIds.includes(doc.id); // TODO ignore on empty
    });
  }

  private orderDocuments(documents: DocumentModel[], documentIdsOrder: string[]): DocumentModel[] {
    if (!documentIdsOrder || documentIdsOrder.length === 0) {
      return documents;
    }

    const orderedDocuments: DocumentModel[] = documentIdsOrder.map(id => documents.find(doc => doc.id === id))
      .filter(doc => !!doc);
    const leftDocuments = documents.filter(doc => !orderedDocuments.includes(doc));
    return orderedDocuments.concat(leftDocuments);
  }

  private bindTemplate() {
    this.template$ = this.store.select(selectSmartDocTemplatesDictionary).pipe(
      map(templates => {
        if (this.templateId) {
          return templates[this.templateId];
        }
        if (this.correlationId) {
          const template: SmartDocTemplateModel = Object.values(templates).find(template => template.correlationId === this.correlationId);
          this.templateId = template.id;
          return template;
        }
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('config') && this.config && this.config.smartdoc && this.config.smartdoc.templateId) {
      this.loadTemplate(this.config.smartdoc.templateId);
    }
    if (changes.hasOwnProperty('query') && this.query) {
      this.getData(this.query);
    }
  }

  public ngOnInit() {
    if (this.embedded) {
      this.initEmbeddedTemplate();
    } else {
      this.initMainTemplate();
    }
  }

  private initEmbeddedTemplate() {
    this.getData(this.query);

    const templateId = this.config.smartdoc ? this.config.smartdoc.templateId : null;
    this.loadOrCreateTemplate(templateId);
  }

  private initMainTemplate() {
    this.querySubscription = this.store.select(selectQuery).subscribe(query => {
      this.query = query;
      this.getData(this.query);
    });

    this.configSubscription = this.store.select(selectViewConfig).subscribe(config => {
      const templateId = config.smartdoc ? config.smartdoc.templateId : null;
      this.loadOrCreateTemplate(templateId);
    });
  }

  private loadOrCreateTemplate(templateId: string) {
    if (templateId) {
      this.loadTemplate(templateId);
    } else {
      this.createNewTemplate(this.query.collectionCodes[0]);
    }
  }

  private loadTemplate(templateId: string) {
    this.store.dispatch(new SmartDocTemplatesAction.Get({templateId: templateId}));
  }

  public ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }

    // TODO if view not saved delete template with correlationId
  }

  private createNewTemplate(collectionCode: string) {
    this.correlationId = CorrelationIdGenerator.generate();

    this.getCollectionByCode(collectionCode).subscribe(collection => {
      const template: SmartDocTemplateModel = {
        collectionCode: collectionCode,
        correlationId: this.correlationId,
        parts: [this.createFirstTextPart(collection)]
      };
      this.store.dispatch(new SmartDocTemplatesAction.Create({template: template}));
    });
  }

  private createFirstTextPart(collection: CollectionModel): SmartDocTemplatePartModel {
    return {
      type: SmartDocTemplatePartType.Text,
      textData: this.createFirstTextData(collection)
    };
  }

  private createFirstTextHtml(collection: CollectionModel): string {
    return collection.attributes.map(attribute =>
      `${attribute.name}: <span class="attribute" data-attribute-id="${attribute.id}">﻿<span contenteditable="false"> </span>﻿</span>`
    ).join('<br>');
  }

  private createFirstTextData(collection: CollectionModel): any {
    const ops: DeltaOperation[] = collection.attributes.reduce<DeltaOperation[]>((ops, attribute) => {
      return ops.concat({insert: attribute.name + ': '}, {insert: {attribute: {id: attribute.id}}}, {insert: '\n'});
    }, []);
    return {ops};
  }

  private getCollectionByCode(collectionCode: string): Observable<CollectionModel> {
    return this.collections$.pipe(
      map(collections => collections.find(collection => collection.code === collectionCode)),
      skipWhile(collection => !collection),
      first()
    );
  }

  private getData(query: QueryModel) {
    this.store.dispatch(new CollectionsAction.Get({query: {}}));
    this.store.dispatch(new DocumentsAction.Get({query: query}));
    this.store.dispatch(new LinkTypesAction.Get({query: {collectionCodes: query.collectionCodes}}));
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionCodes && this.query.collectionCodes.length === 1;
  }

  public onSizeChange(size: SizeType) {
    this.size = size;
  }

  public getColClasses(): string {
    const collClasses = new Map([
      [SizeType.S, 'col-lg-6 col-xl-5'],
      [SizeType.M, 'col-lg-8 col-xl-7'],
      [SizeType.L, 'col-lg-10 col-xl-9'],
      [SizeType.XL, 'col-lg-12 col-xl-11']
    ]);
    return !this.embedded ? collClasses.get(this.size) : '';
  }

  public onClickDocument(event: MouseEvent) {
    event.stopPropagation();
  }

  public onMoveDocument(documentId: string, index: number) {
    Observable.combineLatest(
      this.store.select(selectViewSmartDocConfig),
      this.documents$,
      this.template$
    ).pipe(
      first()
    ).subscribe(([config, documents, template]: [SmartDocConfigModel, DocumentModel[], SmartDocTemplateModel]) => {
      const documentIds = documents.map(doc => doc.id)
        .filter(id => id !== documentId);
      documentIds.splice(index, 0, documentId);
      const documentIdsOrder = documentIds.filter(id => !!id);

      if (this.embedded) {
        this.updateEmbeddedDocumentsOrder(config, template, documentIdsOrder);
      } else {
        this.updateTopLevelDocumentsOrder(config, template, documentIdsOrder);
      }
    });
  }

  private updateEmbeddedDocumentsOrder(oldConfig: SmartDocConfigModel, template: SmartDocTemplateModel, documentIds: string[]) {
    const smartDocConfig: SmartDocConfigModel = oldConfig ? {...oldConfig} : {templateId: null};
    const innerDocumentIdsOrder: { [key: string]: string[] } = smartDocConfig.innerDocumentIdsOrder ? {...smartDocConfig.innerDocumentIdsOrder} : {};
    innerDocumentIdsOrder[this.linkedDocument.id + this.templateId] = documentIds;

    const smartdoc: SmartDocConfigModel = {...oldConfig, innerDocumentIdsOrder};
    this.store.dispatch(new ViewsAction.ChangeConfig({config: {smartdoc}}));
  }

  private updateTopLevelDocumentsOrder(oldConfig: SmartDocConfigModel, template: SmartDocTemplateModel, documentIds: string[]) {
    const smartDocConfig: SmartDocConfigModel = oldConfig ? {...oldConfig, templateId: template.id} : {templateId: template.id};
    const smartdoc: SmartDocConfigModel = {...smartDocConfig, documentIdsOrder: documentIds};
    this.store.dispatch(new ViewsAction.ChangeConfig({config: {smartdoc}}));
  }

}
