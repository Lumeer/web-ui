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
import {AttributeHelper} from 'app/shared/utils/attribute-helper';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {map, switchMap} from 'rxjs/operators';
import {Attribute} from '../../../core/dto/attribute';
import {Collection} from '../../../core/dto/collection';
import {Document} from '../../../core/dto/document';
import {LinkInstance} from '../../../core/dto/link-instance';
import {LinkType} from '../../../core/dto/link-type';
import {Query} from '../../../core/dto/query';
import {CollectionService} from '../../../core/rest/collection.service';
import {DocumentService} from '../../../core/rest/document.service';
import {LinkInstanceService} from '../../../core/rest/link-instance.service';
import {LinkTypeService} from '../../../core/rest/link-type.service';
import {AppState} from '../../../core/store/app.state';
import {selectNavigation, selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {selectViewsDictionary, selectViewsState} from '../../../core/store/views/views.state';
import {NotificationService} from '../../../core/notifications/notification.service';
import {AttributeChangeEvent} from './event/attribute-change-event';
import {DataChangeEvent} from './event/data-change-event';
import {LinkInstanceEvent} from './event/link-instance-event';
import {TableLinkEvent} from './event/table-link-event';
import {TableConfig} from './model/table-config';
import {TablePart} from './model/table-part';
import {TableManagerService} from './util/table-manager.service';
import {PerspectiveComponent} from '../perspective.component';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss']
})
export class TablePerspectiveComponent implements PerspectiveComponent, OnInit, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public config: { table?: TableConfig } = {};

  @Input()
  public embedded: boolean;

  @Input()
  public editable: boolean;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private linkInstanceService: LinkInstanceService,
              private linkTypeService: LinkTypeService,
              private notificationService: NotificationService,
              private store: Store<AppState>,
              private tableManagerService: TableManagerService) {
  }

  public parts: TablePart[] = [];

  private subscription: Subscription;

  public ngOnInit() {
    if (this.query) {
      this.initTable();
      return;
    }

    this.subscription = Observable.combineLatest(
      this.store.select(selectNavigation),
      this.store.select(selectViewsDictionary)
    ).pipe(
      map(([navigation, views]) => {
        const view = navigation.workspace ? views[navigation.workspace.viewCode] : null;
        return view ? [navigation.query, view.config] : [navigation.query, {}];
      })
    ).subscribe(([query, config]) => {
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

  private getTableConfig(): Observable<TableConfig> {
    return this.store.select(selectWorkspace).pipe(
      switchMap(workspace => {
        if (workspace.viewCode) {
          return this.store.select(selectViewsDictionary).pipe(
            map(views => views[workspace.viewCode].config.table)
          );
        } else {
          return this.store.select(selectViewsState).pipe(
            map(views => views.config)
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
            collectionCode: this.query.collectionCodes[0],
            attributeIds: []
          }
        ]
      };
    }
  }

  private fetchDataAndCreateTable() {
    this.tableManagerService.createTableFromConfig(this.config.table)
      .subscribe(parts => this.parts = parts);
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionCodes && this.query.collectionCodes.length === 1;
  }

  public extractConfig(): any {
    this.config.table = this.tableManagerService.extractTableConfig();
    return this.config;
  }

  public onDataChange(event: DataChangeEvent) {
    if (!event.attribute.fullName) {
      this.createAttribute(event.collection, event.attribute);
    }

    const doc = event.document;
    doc.data[event.attribute.fullName] = event.value;

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
      this.notificationService.success('Record has been created!');

      successCallback();
    });
  }

  private updateDocument(doc: Document) {
    this.documentService.patchDocumentData(doc).subscribe(() => {
      this.notificationService.success('Record has been updated!');
    });
  }

  public onDeleteDocument(doc: Document) {
    this.documentService.removeDocument(doc.collectionCode, doc.id).subscribe(() => {
      const index = this.tableManagerService.documents.indexOf(doc);
      this.tableManagerService.documents.splice(index, 1);
      this.notificationService.success('Record has been deleted!');
    });
  }

  public onCreateAttribute(event: AttributeChangeEvent) {
    this.createAttribute(event.collection, event.attribute);
  }

  public onRenameAttribute(event: AttributeChangeEvent) {
    if (event.attribute.fullName) {
      this.updateAttribute(event.collection, event.attribute);
    } else {
      this.createAttribute(event.collection, event.attribute);
    }
  }

  public onDeleteAttribute(event: AttributeChangeEvent) {
    this.deleteAttribute(event.collection, event.attribute);
  }

  private createAttribute(collection: Collection, attribute: Attribute) {
    attribute.fullName = AttributeHelper.generateAttributeId(attribute.name);

    this.collectionService.updateAttribute(collection.code, attribute.fullName, attribute).subscribe(() => {
      collection.attributes.push(attribute);
      this.notificationService.success('Attribute has been created!');
    });
  }

  private updateAttribute(collection: Collection, attribute: Attribute) {
    this.collectionService.updateAttribute(collection.code, attribute.fullName, attribute).subscribe(() => {
      this.notificationService.success('Attribute has been updated!');
    });
  }

  private deleteAttribute(collection: Collection, attribute: Attribute) {
    this.collectionService.removeAttribute(collection.code, attribute.fullName).subscribe(() => {
      AttributeHelper.removeAttributeFromArray(attribute, collection.attributes);
      this.notificationService.success('Attribute has been deleted!');
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
      collectionCodes: [lastCollection.code, collection.code]
    };

    this.linkTypeService.createLinkType(linkType); // TODO not subscribed
    this.tableManagerService.linkTypes.push(linkType);

    return linkType;
  }

  public onCreateLinkInstance(event: LinkInstanceEvent) {
    this.createLinkInstance(event.linkType, event.documents);
  }

  public onDeleteLinkInstance(linkInstanceId: string) {
    this.linkInstanceService.deleteLinkInstance(linkInstanceId).subscribe(() => {
      this.notificationService.success('Link has been deleted!');
    });
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
      this.notificationService.success('Link has been created!');
    });
  }

}
