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

import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {distinct, first, map, skipWhile, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../core/store/collections/collections.action';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectAllDocuments} from '../../../core/store/documents/documents.state';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {SmartDocAction} from '../../../core/store/smartdoc/smartdoc.action';
import {SmartDocModel, SmartDocPartModel, SmartDocPartType} from '../../../core/store/smartdoc/smartdoc.model';
import {selectSelectedSmartDocPart} from '../../../core/store/smartdoc/smartdoc.state';
import {ViewConfigModel} from '../../../core/store/views/view.model';
import {ViewsAction} from '../../../core/store/views/views.action';
import {selectViewSmartDocConfig} from '../../../core/store/views/views.state';
import {SizeType} from '../../../shared/slider/size-type';
import {GridLayout} from '../../../shared/utils/layout/grid-layout';
import {PerspectiveComponent} from '../perspective.component';
import {SmartDocUtils} from './smartdoc.utils';

@Component({
  selector: 'smartdoc-perspective',
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

  @Input()
  public path: number[] = [];

  public smartDoc: SmartDocModel;

  public collections$: Observable<CollectionModel[]>;

  public collection: CollectionModel;
  public documents: DocumentModel[];

  private documentsSubscription: Subscription;
  private initSubscription: Subscription;
  private selectedDocumentSubscription: Subscription;

  private selectedDocumentId: string;

  public size: SizeType = SizeType.M;

  private documentsLayout: GridLayout;
  private documentMoved: boolean;

  public constructor(private store: Store<AppState>,
                     private zone: NgZone) {
  }

  public ngOnInit() {
    this.collections$ = this.store.select(selectAllCollections);
    this.initSubscription = this.initSmartDoc().subscribe(() => this.bindDocumentsData());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('config') && this.config && this.config.smartdoc) {
      this.smartDoc = this.config.smartdoc;
    }
    if (changes.hasOwnProperty('query') && this.query) {
      this.getData(this.query);
    }
  }

  public ngOnDestroy() {
    if (this.documentsSubscription) {
      this.documentsSubscription.unsubscribe();
    }
    if (this.initSubscription) {
      this.initSubscription.unsubscribe();
    }
    if (this.selectedDocumentSubscription) {
      this.selectedDocumentSubscription.unsubscribe();
    }
    this.destroyLayout();
  }

  private initSmartDoc(): Observable<any> {
    return this.loadQuery().pipe(
      first(),
      withLatestFrom(this.store.select(selectViewSmartDocConfig)),
      switchMap(([query, smartDocConfig]) => {
        this.getData(query);

        if (!this.embedded && !smartDocConfig) {
          const collectionId = query && query.collectionIds ? query.collectionIds[0] : null;
          return this.getCollectionById(collectionId).pipe(map(collection => {
            this.collection = collection;
            const defaultSmartDoc: SmartDocModel = {
              collectionId: collection.id,
              parts: [SmartDocUtils.createInitialTextPart(collection)]
            };
            this.store.dispatch(new ViewsAction.ChangeSmartDocConfig({config: defaultSmartDoc}));
          }));
        }

        return Observable.of(null);
      })
    );
  }

  private loadQuery(): Observable<QueryModel> {
    return this.embedded ? Observable.of(this.query) : this.store.select(selectQuery).pipe(
      tap(query => this.query = query)
    );
  }

  private createSingleTextPart(): SmartDocPartModel {
    const delta = {
      ops: [
        {insert: 'Insert your text here...'}
      ]
    };

    return {
      type: SmartDocPartType.Text,
      textData: delta
    };
  }

  private bindDocumentsData() {
    this.bindDocuments();
    this.bindSelectedDocument();
  }

  private bindSelectedDocument() {
    this.selectedDocumentSubscription = this.store.select(selectSelectedSmartDocPart).subscribe((selected) => {
      this.selectedDocumentId = selected && (!this.embedded || JSON.stringify(this.path) === JSON.stringify(selected.path)) ? selected.documentId : null;
    });
  }

  private bindDocuments() {
    this.documentsSubscription = Observable.combineLatest(
      this.store.select(selectAllDocuments),
      this.store.select(selectViewSmartDocConfig)
    ).pipe(
      distinct(),
      skipWhile(([, smartDoc]) => !smartDoc)
    ).subscribe(([documents, smartDocConfig]) => {
      this.smartDoc = this.embedded ? this.config.smartdoc : smartDocConfig;

      if (!this.documentMoved) {
        const filteredDocuments = this.filterDocuments(documents);
        const documentIdsOrder: string[] = this.smartDoc.documentIdsOrder || [];
        this.documents = this.orderDocuments(filteredDocuments, documentIdsOrder);

        setTimeout(() => this.refreshLayout(), 100);
      } else {
        this.documentMoved = false;
      }
    });
  }

  private filterDocuments(documents: DocumentModel[]): DocumentModel[] {
    return documents.filter(doc => {
      if (!this.query || (!this.query.collectionIds || !this.query.collectionIds.includes(doc.collectionId))
      ) {
        return false;
      }

      if (this.embedded) {
        return this.query.documentIds.includes(doc.id);
      }

      return this.query.documentIds.length === 0 || this.query.documentIds.includes(doc.id);
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

  private refreshLayout() {
    this.destroyLayout();
    this.initLayout();
  }

  private initLayout() {
    this.documentsLayout = new GridLayout('.' + this.documentsLayoutContainerClass(), {
      dragEnabled: true,
      dragAxis: 'y',
      dragStartPredicate: {
        handle: '.record-mover-' + SmartDocUtils.pathToString(this.path)
      }
    }, this.zone, ({fromIndex, toIndex}) => this.onMoveDocument(fromIndex, toIndex));
  }

  public documentsLayoutContainerClass(): string {
    const documentId = this.linkedDocument ? this.linkedDocument.id : '';
    return `documents-layout${documentId}-${SmartDocUtils.pathToString(this.path)}`;
  }

  private destroyLayout() {
    if (this.documentsLayout) {
      this.documentsLayout.destroy();
    }
  }

  private getCollectionById(collectionId: string): Observable<CollectionModel> {
    return this.collections$.pipe(
      map(collections => collections.find(collection => collection.id === collectionId)),
      skipWhile(collection => !collection),
      first()
    );
  }

  private getData(query: QueryModel) {
    this.store.dispatch(new CollectionsAction.Get({query: {}}));
    const queryWithPagination = {...query, page: 0, pageSize: 100}; // TODO implement pagination logic
    this.store.dispatch(new DocumentsAction.Get({query: queryWithPagination}));
    this.store.dispatch(new LinkTypesAction.Get({query: {collectionIds: query.collectionIds}}));
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionIds && this.query.collectionIds.length === 1;
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

  public onMoveDocument(fromIndex: number, toIndex: number) {
    const documentIds = this.documents.map(doc => doc.id);
    const [movedDocumentId] = documentIds.splice(fromIndex, 1);
    documentIds.splice(toIndex, 0, movedDocumentId);

    this.documentMoved = true;
    this.store.dispatch(new SmartDocAction.OrderDocuments({partPath: this.path, documentIds}));
  }

}
