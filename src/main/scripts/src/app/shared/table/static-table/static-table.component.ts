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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TableHeader} from '../model/table-header';
import {TableRow} from '../model/table-row';
import {TableHeaderCell} from '../model/table-header-cell';
import {TableRowCell} from '../model/table-row-cell';
import {TableSettings} from '../model/table-settings';

@Component({
  selector: 'static-table',
  templateUrl: './static-table.component.html',
  styleUrls: ['./static-table.component.scss']
})
export class StaticTableComponent {
  @Input() public header: TableHeader;
  @Input() public rows: TableRow[];
  @Input() public settings: TableSettings;

  @Output() public newValue: EventEmitter<any> = new EventEmitter();
  @Output() public newColumn: EventEmitter<any> = new EventEmitter();
  @Output() public newRow: EventEmitter<any> = new EventEmitter();
  @Output() public valueChange: EventEmitter<any> = new EventEmitter();
  @Output() public headerChange: EventEmitter<any> = new EventEmitter();
  @Output() public removeColumn: EventEmitter<string> = new EventEmitter();
  @Output() public dragColumn: EventEmitter<any> = new EventEmitter();
  @Output() public hideColumn: EventEmitter<string> = new EventEmitter();
  @Output() public showColumn: EventEmitter<string> = new EventEmitter();

  private activeRow: number = -1;

  public onNewColumn(): void {
    this.header.cells.push(StaticTableComponent.createNewColumn(this.header));
    this.rows.forEach((item) => {
      item.cells.push({label: '', active: false, hidden: false, constraints: []});
    });
  }

  public onNewRow(): void {
    this.rows.push(StaticTableComponent.createNewRow(this.header, this.rows.length + 1));
  }

  public onItemHighlight(index, data): void {
    this.activeRow = index;
    this.inactivateItems();
    this.header.cells[data.colIndex].active = true;
    this.checkLastRowCol(index, data.colIndex);
  }

  public onTableBlur(): void {
    this.activeRow = -1;
    this.inactivateItems();
  }

  public onUpdateRow(rowIndex, dataPayload): void {
    this.rows[rowIndex].cells[dataPayload.colIndex].label = dataPayload.data;
    let header: string = this.header.cells[dataPayload.colIndex].label;
    let value: any = {};
    value[header] = dataPayload.data;
    if (this.rows[rowIndex].id) {
      value['id'] = this.rows[rowIndex].id;
      this.valueChange.emit(value);
    } else {
      value['rowIndex'] = rowIndex;
      this.newValue.emit(value);
    }
  }

  public onRemoveColumn(colIndex): void {
    let headerName: string = this.header.cells[colIndex].label;
    this.header.cells.splice(colIndex, 1);
    this.rows = this.rows.map(oneRow => {
      oneRow.cells.splice(colIndex, 1);
      return oneRow;
    });
    this.removeColumn.emit(headerName);
  }

  public onHeaderChange(dataPayload) {
    let oldValue: string = this.header.cells[dataPayload.colIndex].label;
    this.header.cells[dataPayload.colIndex].label = dataPayload.data;
    this.headerChange.emit({oldValue: oldValue, newValue: dataPayload.data});
  }

  public showHideColumn(colIndex: number, hidden: boolean): void {
    this.header.cells[colIndex]['hidden'] = hidden;
    this.rows = this.rows.map(oneRow => {
      oneRow.cells[colIndex]['hidden'] = hidden;
      return oneRow;
    });
  }

  public checkLastRowCol(index, colIndex) {
    if (index === this.rows.length - 1) {
      this.onNewRow();
    }

    if (colIndex === this.header.cells.length - 1) {
      this.onNewColumn();
    }
  }

  public trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  private static createNewRow(header: TableHeader, rowNum: number): TableRow {
    let cells = header.cells.map((header) => {
      return <TableRowCell>{label: '', active: false, hidden: header.hidden, constraints: header.constraints};
    });
    return <TableRow> {id: null, cells: cells, active: false};
  }

  private static createNewColumn(header: TableHeader) {
    return <TableHeaderCell> {
      label: StaticTableComponent.generateHeaderLabel(header.cells.length + 1),
      active: false,
      hidden: false,
      constraints: []
    };
  }

  private inactivateItems() {
    this.header.cells.forEach(data => {
      data.active = false;
    });
  }

  private static generateHeaderLabel(num: number): string {
    let label: string = '';
    while (num > 0) {
      let numeric = (num - 1) % 26;
      label = String.fromCharCode(65 + numeric) + label;
      num = Math.floor((num - 1) / 26);
    }
    return label;
  }
}
