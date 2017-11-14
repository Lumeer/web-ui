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

import {Component, Input, OnInit} from '@angular/core';

import {DocumentService} from '../../../core/rest/document.service';
import {CollectionService} from '../../../core/rest/collection.service';
import {Collection} from '../../../core/dto/collection';
import {Attribute} from '../../../core/dto/attribute';
import {Query} from '../../../core/dto/query';
import {PerspectiveComponent} from '../perspective.component';
import {TableConfig} from './model/table-config';
import {LinkType} from '../../../core/dto/link-type';
import {TablePart} from './model/table-part';
import {LinkInstance} from '../../../core/dto/link-instance';
import {DataChangeEvent} from './event/data-change-event';
import {AttributeHelper} from 'app/shared/utils/attribute-helper';
import {TableLinkEvent} from './event/table-link-event';
import {TableManagerService} from './util/table-manager.service';
import {LinkInstanceService} from '../../../core/rest/link-instance.service';
import {LinkTypeService} from '../../../core/rest/link-type.service';
import {Perspective} from '../perspective';
import {AttributeChangeEvent} from './event/attribute-change-event';
import {LinkInstanceEvent} from './event/link-instance-event';
import {Document} from '../../../core/dto/document';
import {NotificationService} from '../../../notifications/notification.service';
import 'rxjs/add/observable/combineLatest';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html',
  styleUrls: ['./table-perspective.component.scss']
})
export class TablePerspectiveComponent implements PerspectiveComponent, OnInit {

  @Input()
  public query: Query;

  @Input()
  public config: { table?: TableConfig };

  @Input()
  public editable: boolean;

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private linkInstanceService: LinkInstanceService,
              private linkTypeService: LinkTypeService,
              private notificationService: NotificationService,
              private tableManagerService: TableManagerService) {
  }

  public parts: TablePart[] = [];

  public ngOnInit() {
    if (!this.isDisplayable()) {
      return;
    }

    this.createDefaultConfigFromQuery();
    this.fetchDataAndCreateTable();
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
    return this.query.collectionCodes.length === 1;
  }

  public extractConfig(): any {
    this.config[Perspective.Table.id] = this.tableManagerService.extractTableConfig();
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
    this.documentService.createDocument(doc).subscribe((id: string) => {
      doc.id = id;
      this.tableManagerService.documents.push(doc);
      this.notificationService.success('Record has been created!');

      successCallback();
    });
  }

  private updateDocument(doc: Document) {
    this.documentService.patchDocument(doc).subscribe(() => {
      this.notificationService.success('Record has been updated!');
    });
  }

  public onDeleteDocument(doc: Document) {
    this.documentService.removeDocument(doc).subscribe(() => {
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

    this.linkTypeService.createLinkType(linkType);
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

    this.linkInstanceService.createLinkInstance(linkInstance).subscribe((id: string) => {
      linkInstance.id = id;
      this.tableManagerService.linkInstances.push(linkInstance);
      this.notificationService.success('Link has been created!');
    });
  }

}
