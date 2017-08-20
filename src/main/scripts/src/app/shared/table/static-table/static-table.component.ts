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

import {Component, EventEmitter, Input, Output, ChangeDetectorRef, ViewChildren, QueryList} from '@angular/core';
import {TableHeader} from '../model/table-header';
import {TableRow} from '../model/table-row';
import {TableHeaderCell} from '../model/table-header-cell';
import {TableRowCell} from '../model/table-row-cell';
import {TableSettings} from '../model/table-settings';
import {TableRowComponent} from './table-row.component';
import {DataEvent} from '../event/data-event';

@Component({
  selector: 'static-table',
  templateUrl: './static-table.component.html',
  styleUrls: ['./static-table.component.scss']
})
export class StaticTableComponent {
  @Input() public header: TableHeader;
  @Input() public rows: TableRow[];
  @Input() public settings: TableSettings;

  @Output() public newValue: EventEmitter<DataEvent> = new EventEmitter();
  @Output() public newColumn: EventEmitter<any> = new EventEmitter();
  @Output() public newRow: EventEmitter<any> = new EventEmitter();
  @Output() public valueChange: EventEmitter<DataEvent> = new EventEmitter();
  @Output() public headerChange: EventEmitter<DataEvent> = new EventEmitter();
  @Output() public removeColumn: EventEmitter<string> = new EventEmitter();
  @Output() public dragColumn: EventEmitter<any> = new EventEmitter();
  @Output() public hideColumn: EventEmitter<string> = new EventEmitter();
  @Output() public showColumn: EventEmitter<string> = new EventEmitter();

  @ViewChildren(TableRowComponent) private rowsComponents: QueryList<TableRowComponent>;

  private activeRow: number = -1;

  constructor(private ref: ChangeDetectorRef) {
  }

  public onNewColumn(): void {
    this.header.cells.push(StaticTableComponent.createNewColumn(this.header));
    this.rows.forEach((item) => {
      item.cells.push({label: '', active: false, hidden: false});
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
    this.ref.markForCheck();
    // TODO check for performance of manually triggered change detection
  }

  public onTableBlur(): void {
    this.activeRow = -1;
    this.inactivateItems();
  }

  public onUpdateCell(rowIndex, dataPayload): void {
    let colIndex: number = dataPayload.colIndex;
    let newValue = dataPayload.data;
    if (!this.isValueValid(colIndex, newValue)) {
      let rowComponent: TableRowComponent = this.rowsComponents.find(component => component.rowIndex === rowIndex);
      if (rowComponent) {
        rowComponent.setCell(colIndex, this.rows[rowIndex].cells[colIndex].label);
      }
      return;
    }
    this.rows[rowIndex].cells[colIndex].label = newValue;
    let header: string = this.header.cells[colIndex].label;
    let data: any = {};
    data[header] = newValue;
    if (this.rows[rowIndex].id) {
      this.valueChange.emit(<DataEvent> {
        id: this.rows[rowIndex].id,
        rowIndex: rowIndex,
        colIndex: colIndex,
        data: data
      });
    } else {
      this.newValue.emit(<DataEvent> {rowIndex: rowIndex, colIndex: colIndex, data: data});
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
    let colIndex: number = dataPayload.colIndex;
    let oldValue: string = this.header.cells[colIndex].label;
    let newValue: string = dataPayload.data;
    this.header.cells[colIndex].label = newValue;
    let data = {oldValue: oldValue, newValue: newValue};
    this.headerChange.emit(<DataEvent> {colIndex: colIndex, data: data});
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

  public static trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  private isValueValid(colIndex: number, value: any) {
    let headerCell = this.header.cells[colIndex];
    headerCell.constraints.forEach(constraint => {
      // TODO check
    });
    return true;
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
