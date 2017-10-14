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

import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {TableRow} from '../model/table-row';
import {KeyCode} from '../../key-code';

@Component({
  selector: 'table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss']
})
export class TableRowComponent {
  @Input() public row: TableRow;
  @Input() public rowIndex: number;
  @Input() public settings: any;
  @Input() public isActive: boolean;

  @Output() public itemHighlight: EventEmitter<any> = new EventEmitter();
  @Output() public updateCell: EventEmitter<any> = new EventEmitter();

  @Output()
  public moveCursor: EventEmitter<[number, number]> = new EventEmitter();

  @ViewChildren('rowCell') private cells: QueryList<ElementRef>;

  public model: string;

  public setCell(index, value) {
    const element: ElementRef = this.cells.find(c => +c.nativeElement.id === index);
    if (element) {
      element.nativeElement.innerText = value;
    }
  }

  public onEdit(item, index): void {
    const oldValue: string = this.row.cells[index].label.toString().trim();
    const newValue: string = item.toString().trim();
    if (oldValue !== newValue) {
      this.updateCell.emit({colIndex: index, data: newValue});
    }
  }

  public onItemClicked(index): void {
    this.itemHighlight.emit({colIndex: index});
  }

  public onKeyDown(event: KeyboardEvent, columnIndex: number) {
    switch (event.keyCode) {
      case KeyCode.UpArrow:
        this.moveCursor.emit([columnIndex, this.rowIndex - 1]);
        return;
      case KeyCode.DownArrow:
        this.moveCursor.emit([columnIndex, this.rowIndex + 1]);
        return;
      case KeyCode.LeftArrow:
        this.moveCursor.emit([columnIndex - 1, this.rowIndex]);
        return;
      case KeyCode.RightArrow:
        this.moveCursor.emit([columnIndex + 1, this.rowIndex]);
        return;
      case KeyCode.Enter:
        event.preventDefault();
        return;
    }
  }
}
