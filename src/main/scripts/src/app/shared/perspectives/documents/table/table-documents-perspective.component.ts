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
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/switchMap';
import {ActivatedRoute} from '@angular/router';
import {TableRow} from '../../../table/model/table-row';
import {TableHeader} from '../../../table/model/table-header';
import {TableSettings} from '../../../table/model/table-settings';
import {TableHeaderCell} from '../../../table/model/table-header-cell';
import {Attribute} from '../../../../core/dto/attribute';
import {Document} from '../../../../core/dto/document';
import {TableRowCell} from '../../../table/model/table-row-cell';

@Component({
  selector: 'table-documents-perspective',
  templateUrl: './table-documents-perspective.component.html'
})
export class TableDocumentsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: string;

  @Input()
  public editable: boolean;

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
    this.route.paramMap
      .switchMap(params => {
        let code: string = params.get('collectionCode');

        return Observable.combineLatest([
          this.collectionService.getCollection(code),
          this.collectionService.getAttributes(code),
          this.documentService.getDocuments(code)
        ]);
      }).subscribe(([collection, attributes, documents]) => {
      this.collection = collection;
      this.prepareTableData(attributes, documents);
    });
  }

  public onNewValue(data: any) {
    let copy = Object.assign({}, data);
    let rowIndex: number = copy.rowIndex;
    delete data.rowIndex;
    this.documentService.createDocument(this.collection.code, this.convertTableDataToDocument(data))
      .subscribe((json: object) => this.rows[rowIndex].id = json['_id']);
  }

  public onValueChange(data: any) {
    this.documentService.updateDocument(this.collection.code, this.convertTableDataToDocument(data))
      .subscribe();
  }

  public onHeaderChange(data: any) {
    let oldValue: string = data.oldValue;
    let newValue: string = data.newValue;
    this.collectionService.renameAttribute(this.collection.code, oldValue, newValue)
      .subscribe();
  }

  public onRemoveColumn(columnName: string) {
    this.collectionService.dropAttribute(this.collection.code, columnName)
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

  private convertTableDataToDocument(data: any): Document {
    let document: Document = new Document();
    Object.keys(data).forEach(key => {
      if (key === 'id') {
        document.id = data[key];
      } else {
        document.data[key] = data[key];
      }
    });
    return document;
  }

  private prepareTableData(attributes: Attribute[], documents: Document[]) {
    let headerRows: TableHeaderCell[] = attributes.map(attr =>
      <TableHeaderCell>{label: attr.name, active: false, hidden: false, constraints: attr.constraints});
    this.header = <TableHeader> {cells: headerRows};
    this.rows = documents.map(document => {
      let rowCells: TableRowCell[] = this.header.cells.map(headerCell => {
        let value: string = document.data[headerCell.label] ? document.data[headerCell.label] : '';
        return <TableRowCell>{label: value, active: false, hidden: false, constraints: headerCell.constraints};
      });
      return <TableRow> {id: document.id, cells: rowCells, active: false};
    });
  }

  private static createNewRow(header: TableHeader, rowNum: number): TableRow {
    let cells = header.cells.map((header) => {
      return <TableRowCell>{label: '', active: false, hidden: header.hidden, constraints: header.constraints};
    });
    return <TableRow> {id: null, cells: cells, active: false};
  }

}
