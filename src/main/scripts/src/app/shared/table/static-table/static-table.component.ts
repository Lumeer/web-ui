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
    const colIndex: number = dataPayload.colIndex;
    const newValue = dataPayload.data;
    if (!this.isValueValid(colIndex, newValue)) {
      const rowComponent: TableRowComponent = this.rowsComponents.find(component => component.rowIndex === rowIndex);
      if (rowComponent) {
        rowComponent.setCell(colIndex, this.rows[rowIndex].cells[colIndex].label);
      }
      return;
    }
    this.rows[rowIndex].cells[colIndex].label = newValue;
    const header: string = this.header.cells[colIndex].label;
    const data: any = {};
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
    const headerName: string = this.header.cells[colIndex].label;
    this.header.cells.splice(colIndex, 1);
    this.rows = this.rows.map(oneRow => {
      oneRow.cells.splice(colIndex, 1);
      return oneRow;
    });
    this.removeColumn.emit(headerName);
  }

  public onHeaderChange(dataPayload) {
    const colIndex: number = dataPayload.colIndex;
    const oldValue: string = this.header.cells[colIndex].label;
    const newValue: string = dataPayload.data;
    this.header.cells[colIndex].label = newValue;
    const data = {oldValue: oldValue, newValue: newValue};
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

  public trackByFn(index, item) {
    return item && item.id ? item.id : index;
  }

  private isValueValid(colIndex: number, value: any) {
    const headerCell = this.header.cells[colIndex];
    headerCell.constraints.forEach(constraint => {
      // TODO check
    });
    return true;
  }

  private static createNewRow(header: TableHeader, rowNum: number): TableRow {
    const cells = header.cells.map((header) => {
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
