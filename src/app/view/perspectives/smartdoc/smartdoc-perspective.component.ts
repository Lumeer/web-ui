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
import {TemplateConfigModel, ViewConfigModel} from '../../../core/store/views/view.model';
import {selectViewConfig} from '../../../core/store/views/views.state';
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
    this.bindCollection();
    this.bindDocuments();
    this.bindTemplate();
  }

  private bindCollection() {
    this.collections$ = this.store.select(selectAllCollections);
  }

  private bindDocuments() {
    this.documents$ = this.store.select(selectAllDocuments).pipe(
      map((documents: DocumentModel[]) => documents.filter(doc => {
        if (!this.query || !this.query.collectionCodes || !this.query.collectionCodes.includes(doc.collectionCode)) {
          return false;
        }

        return this.query.documentIds.length === 0 || this.query.documentIds.includes(doc.id); // TODO ignore on empty
      }))
    );
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
    if (changes.hasOwnProperty('config') && this.config && this.config.template && this.config.template.templateId) {
      this.loadTemplate(this.config.template.templateId);
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

    const templateId = this.config.template ? this.config.template.templateId : null;
    this.loadOrCreateTemplate(templateId);
  }

  private initMainTemplate() {
    this.querySubscription = this.store.select(selectQuery).subscribe(query => {
      this.query = query;
      this.getData(this.query);
    });

    this.configSubscription = this.store.select(selectViewConfig).subscribe(config => {
      const templateId = config.template ? config.template.templateId : null;
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

  public extractConfig(): { template: TemplateConfigModel } {
    return {
      template: {
        templateId: this.templateId,
        documentsOrder: null
      }
    };
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionCodes && this.query.collectionCodes.length === 1;
  }

  public onAddTemplatePart(event: { templateId: string, part: SmartDocTemplatePartModel }) {
    this.store.dispatch(new SmartDocTemplatesAction.AddPart(event));
  }

  public onSizeChange(size: SizeType) {
    this.size = size;
  }

  public getColClasses(): string {
    const collClasses = new Map([
      [SizeType.S, 'col-lg-6 col-xl-5'],
      [SizeType.M, 'col-lg-8 col-xl-7'],
      [SizeType.L, 'col-lg-10 col-xl-9'],
      [SizeType.XL, 'col-lg-12 col-xl-11'],
    ]);
    return !this.embedded ? collClasses.get(this.size) : '';
  }

  public onClickDocument(event: MouseEvent) {
    event.stopPropagation();
  }

}
