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

import {Component, Input, Output, EventEmitter} from '@angular/core';
import {TableHeader} from '../model/table-header';
import {DataEvent} from '../event/data-event';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent {
  @Input() public header: TableHeader;
  @Input() public settings: any;

  @Output() public newColumn: EventEmitter<any> = new EventEmitter();
  @Output() public headerChange: EventEmitter<any> = new EventEmitter();
  @Output() public removeColumn: EventEmitter<any> = new EventEmitter();
  @Output() public hideColumn: EventEmitter<any> = new EventEmitter();
  @Output() public showColumn: EventEmitter<any> = new EventEmitter();

  public model: string;
  public hoverIndex: number = -1;

  public headerExists(header: string): boolean {
    return this.getAllColumnNames().some(value => value === header);
  }

  public onEdit(item, index): void {
    this.headerChange.emit({colIndex: index, data: item});
  }

  public onHover(index) {
    this.hoverIndex = index;
  }

  public toggleColumn(index, hidden) {
    hidden ? this.showColumn.emit(index) : this.hideColumn.next(index);
  }

  private getAllColumnNames(): string[] {
    return this.header.cells.map(cell => cell.label);
  }
}
