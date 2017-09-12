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

import {Component, Input, OnInit} from '@angular/core';

import {DocumentService} from '../../../../core/rest/document.service';
import {Perspective} from '../../perspective';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {Observable} from 'rxjs/Observable';
import {ActivatedRoute} from '@angular/router';
import {TableRow} from '../../../table/model/table-row';
import {TableHeader} from '../../../table/model/table-header';
import {TableSettings} from '../../../table/model/table-settings';
import {TableHeaderCell} from '../../../table/model/table-header-cell';
import {Attribute} from '../../../../core/dto/attribute';
import {Document} from '../../../../core/dto/document';
import {TableRowCell} from '../../../table/model/table-row-cell';
import {DataEvent} from '../../../table/event/data-event';
import {Query} from '../../../../core/dto/query';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'table-documents-perspective',
  templateUrl: './table-documents-perspective.component.html'
})
export class TableDocumentsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean;

  public displayable: boolean;

  public collection: Collection;
  public header: TableHeader;
  public rows: TableRow[];

  public settings = <TableSettings>{
    color: '#3498DB',
    highlightColor: '#F39C12',
    editable: true,
    lineNumberColor: '#b4bcc2'
  };

  constructor(private collectionService: CollectionService,
              private documentService: DocumentService,
              private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.displayable = this.query.collectionCodes.length === 1;
    if (!this.displayable) {
      return;
    }

    const collectionCode = this.query.collectionCodes.pop();
    this.fetchData(collectionCode);
  }

  private fetchData(collectionCode: string): void {
    Observable.combineLatest(
      this.collectionService.getCollection(collectionCode),
      this.documentService.getDocuments(collectionCode)
    ).subscribe(([collection, documents]) => {
      this.collection = collection;
      this.prepareTableData(collection.attributes, documents);
    });
  }

  public onNewValue(dataEvent: DataEvent) {
    this.documentService.createDocument(this.convertDataEventToDocument(dataEvent))
      .subscribe(response => {
        const id = response.headers.get('Location').split('/').pop();
        this.rows[dataEvent.rowIndex].id = id;
      });
  }

  public onValueChange(dataEvent: DataEvent) {
    this.documentService.patchDocument(this.convertDataEventToDocument(dataEvent))
      .subscribe();
  }

  public onHeaderChange(dataEvent: DataEvent) {
    const oldValue: string = dataEvent.data.oldValue;
    const newValue: string = dataEvent.data.newValue;
    // TODO use real attribute values
    this.collectionService.updateAttribute(this.collection.code, oldValue, {
      fullName: newValue,
      name: newValue,
      usageCount: null,
      constraints: []
    }).subscribe();
  }

  public onRemoveColumn(columnName: string) {
    this.collectionService.removeAttribute(this.collection.code, columnName)
      .subscribe();
  }

  public onDragColumn(data: any) {
    // TODO
  }

  public onHideColumn(data: any) {
    // TODO
  }

  public onShowColumn(data: any) {
    // TODO
  }

  private convertDataEventToDocument(dataEvent: DataEvent): Document {
    const document = new Document();
    Object.keys(dataEvent.data).forEach(key => document.data[key] = dataEvent.data[key]);
    document.id = dataEvent.id;
    document.collectionCode = this.collection.code;
    return document;
  }

  private prepareTableData(attributes: Attribute[], documents: Document[]) {
    // TODO remove after implementing attributes in backend
    attributes = this.createAttributesFromDocuments(documents);
    const headerRows: TableHeaderCell[] = attributes.map(TableDocumentsPerspectiveComponent.convertAttributeToHeaderCell);
    this.header = <TableHeader> {cells: headerRows};
    this.rows = documents.map(document => TableDocumentsPerspectiveComponent.convertDocumentToRow(this.header, document));
  }

  private createAttributesFromDocuments(documents: Document[]): Attribute[] {
    const set = new Set<string>();
    documents.forEach(document => Object.keys(document.data).forEach(key => {
      if (key !== '_id') {
        set.add(key);
      }
    }));
    const attributes: Attribute[] = [];
    set.forEach(name => attributes.push({name: name, usageCount: 10, fullName: name, constraints: []}));
    return attributes;
  }

  private static convertAttributeToHeaderCell(attribute: Attribute): TableHeaderCell {
    return <TableHeaderCell>{label: attribute.name, active: false, hidden: false, constraints: attribute.constraints};
  }

  private static convertDocumentToRow(header: TableHeader, document: Document): TableRow {
    const rowCells: TableRowCell[] = header.cells.map(headerCell => TableDocumentsPerspectiveComponent.convertToRowCell(document, headerCell));
    return <TableRow> {id: document.id, cells: rowCells, active: false};
  }

  private static convertToRowCell(document: Document, headerCell: TableHeaderCell): TableRowCell {
    const value: string = document.data[headerCell.label] ? document.data[headerCell.label] : '';
    return <TableRowCell>{label: value, active: false, hidden: false, constraints: headerCell.constraints};
  }

  private static createNewRow(header: TableHeader, rowNum: number): TableRow {
    const cells = header.cells.map((header) => {
      return <TableRowCell>{label: '', active: false, hidden: header.hidden, constraints: header.constraints};
    });
    return <TableRow> {id: null, cells: cells, active: false};
  }

}
