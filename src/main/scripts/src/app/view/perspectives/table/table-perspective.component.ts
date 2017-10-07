/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {Observable} from 'rxjs/Observable';
import {ActivatedRoute} from '@angular/router';
import {TableRow} from '../../../shared/table/model/table-row';
import {TableHeader} from '../../../shared/table/model/table-header';
import {TableSettings} from '../../../shared/table/model/table-settings';
import {TableHeaderCell} from '../../../shared/table/model/table-header-cell';
import {Attribute} from '../../../core/dto/attribute';
import {Document} from '../../../core/dto/document';
import {TableRowCell} from '../../../shared/table/model/table-row-cell';
import {DataEvent} from '../../../shared/table/event/data-event';
import {Query} from '../../../core/dto/query';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/switchMap';
import {PerspectiveComponent} from '../perspective.component';

@Component({
  selector: 'table-perspective',
  templateUrl: './table-perspective.component.html'
})
export class TablePerspectiveComponent implements PerspectiveComponent, OnInit {

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
    const headerRows: TableHeaderCell[] = attributes.map(TablePerspectiveComponent.convertAttributeToHeaderCell);
    this.header = <TableHeader> {cells: headerRows};
    this.rows = documents.map(document => TablePerspectiveComponent.convertDocumentToRow(this.header, document));
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
    const rowCells: TableRowCell[] = header.cells.map(headerCell => TablePerspectiveComponent.convertToRowCell(document, headerCell));
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
