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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {map, switchMap, withLatestFrom} from 'rxjs/operators';
import {Attribute, Collection, Document, LinkInstance, LinkType, Query} from '../../../core/dto';
import {CollectionService, DocumentService, LinkInstanceService, LinkTypeService} from '../../../core/rest';
import {AppState} from '../../../core/store/app.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {selectNavigation, selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {TableConfigModel, ViewConfigModel} from '../../../core/store/views/view.model';
import {selectViewConfig, selectViewsDictionary, selectViewsState} from '../../../core/store/views/views.state';
import {AttributeHelper} from '../../../shared/utils/attribute-helper';
import {PerspectiveComponent} from '../perspective.component';
import {AttributeChangeEvent, DataChangeEvent, LinkInstanceEvent, TableLinkEvent} from './event';
import {TablePart} from './model';
import {TableManagerService} from './util/table-manager.service';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss']
})
export class TablePerspectiveComponent implements PerspectiveComponent, OnInit, OnDestroy {

  @Input()
  public linkedDocument: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public config: ViewConfigModel = {};

  @Input()
  public embedded: boolean;

  @Input()
  public editable: boolean;

  private linkTypeId: string;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private linkInstanceService: LinkInstanceService,
              private linkTypeService: LinkTypeService,
              private store: Store<AppState>,
              private tableManagerService: TableManagerService) {
  }

  public parts: TablePart[] = [];

  private subscription: Subscription;

  public ngOnInit() {
    if (this.embedded && this.query) {
      this.linkTypeId = this.query.linkTypeIds[0];
      this.initTable();
      return;
    }

    this.subscription = Observable.combineLatest(
      this.store.select(selectNavigation),
      this.store.select(selectViewsDictionary)
    ).pipe(
      withLatestFrom(this.store.select(selectViewConfig)),
      map(([[navigation, views], config]) => {
        const view = navigation.workspace ? views[navigation.workspace.viewCode] : null;
        return view ? [navigation.query, view.config] : [navigation.query, config];
      })
    ).subscribe(([query, config]: [QueryModel, ViewConfigModel]) => {
      this.query = query;
      this.config = config;

      this.initTable();
    });
  }

  private initTable() {
    if (!this.isDisplayable()) {
      return;
    }

    this.createDefaultConfigFromQuery();
    this.fetchDataAndCreateTable();
  }

  public ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private getTableConfig(): Observable<TableConfigModel> {
    return this.store.select(selectWorkspace).pipe(
      switchMap(workspace => {
        if (workspace.viewCode) {
          return this.store.select(selectViewsDictionary).pipe(
            map(views => views[workspace.viewCode].config.table)
          );
        } else {
          return this.store.select(selectViewsState).pipe(
            map(views => views.config.table)
          );
        }
      })
    );
  }

  private createDefaultConfigFromQuery() {
    if (!this.config.table) {
      this.config.table = {
        parts: [
          {
            collectionId: this.query.collectionIds[0],
            attributeIds: []
          }
        ]
      };
    }
  }

  private fetchDataAndCreateTable() {
    this.tableManagerService.createTableFromConfig(this.query, this.config.table, this.linkTypeId, this.linkedDocument)
      .subscribe(parts => this.parts = parts);
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionIds && this.query.collectionIds.length === 1;
  }

  public extractConfig(): any {
    this.config.table = this.tableManagerService.extractTableConfig();
    return this.config;
  }

  public onDataChange(event: DataChangeEvent) {
    if (!event.attribute.id) {
      this.createAttribute(event.collection, event.attribute);
    }

    const doc = event.document;
    doc.data[event.attribute.name] = event.value;

    if (doc.id) {
      this.updateDocument(doc);
    } else {
      this.createDocument(doc, () => {
        if (event.linkedDocument) {
          this.createLinkInstance(event.linkType, [doc, event.linkedDocument]);
        }
      });
    }
  }

  private createDocument(doc: Document, successCallback: () => void) {
    this.documentService.createDocument(doc).subscribe((document: Document) => {
      this.tableManagerService.documents.push(document);

      successCallback();
    });
  }

  private updateDocument(doc: Document) {
    this.documentService.patchDocumentData(doc).subscribe();
  }

  public onDeleteDocument(doc: Document) {
    this.documentService.removeDocument(doc.collectionId, doc.id).subscribe(() => {
      const index = this.tableManagerService.documents.indexOf(doc);
      this.tableManagerService.documents.splice(index, 1);
    });
  }

  public onCreateAttribute(event: AttributeChangeEvent) {
    this.createAttribute(event.collection, event.attribute);
  }

  public onRenameAttribute(event: AttributeChangeEvent) {
    if (event.attribute.id) {
      this.updateAttribute(event.collection, event.attribute);
    } else {
      this.createAttribute(event.collection, event.attribute);
    }
  }

  public onDeleteAttribute(event: AttributeChangeEvent) {
    this.deleteAttribute(event.collection, event.attribute);
  }

  private createAttribute(collection: Collection, attribute: Attribute) {
    this.collectionService.createAttribute(collection.id, attribute).subscribe(() => {
      collection.attributes.push(attribute);
    });
  }

  private updateAttribute(collection: Collection, attribute: Attribute) {
    this.collectionService.updateAttribute(collection.id, attribute.id, attribute).subscribe();
  }

  private deleteAttribute(collection: Collection, attribute: Attribute) {
    this.collectionService.removeAttribute(collection.id, attribute.id).subscribe(() => {
      AttributeHelper.removeAttributeFromArray(attribute, collection.attributes);
    });
  }

  public onAddLinkedPart(event: TableLinkEvent) {
    if (!event.linkType) {
      event.linkType = this.createLinkType(event.collection);
    }

    this.tableManagerService.addTablePart(event.linkType, event.collection, event.attribute);
  }

  private createLinkType(collection: Collection): LinkType {
    const lastCollection = this.parts[this.parts.length - 1].collection;

    const linkType: LinkType = {
      name: lastCollection.name + '-' + collection.name, // TODO input from user
      collectionIds: [lastCollection.id, collection.id]
    };

    this.linkTypeService.createLinkType(linkType); // TODO not subscribed
    this.tableManagerService.linkTypes.push(linkType);

    return linkType;
  }

  public onCreateLinkInstance(event: LinkInstanceEvent) {
    this.createLinkInstance(event.linkType, event.documents);
  }

  public onDeleteLinkInstance(linkInstanceId: string) {
    this.linkInstanceService.deleteLinkInstance(linkInstanceId).subscribe();
  }

  private createLinkInstance(linkType: LinkType, documents: [Document, Document]) {
    const linkInstance: LinkInstance = {
      linkTypeId: linkType.id,
      documentIds: [documents[0].id, documents[1].id],
      data: {}
    };

    this.linkInstanceService.createLinkInstance(linkInstance).subscribe((instance: LinkInstance) => {
      linkInstance.id = instance.id;
      this.tableManagerService.linkInstances.push(linkInstance);
    });
  }

}
