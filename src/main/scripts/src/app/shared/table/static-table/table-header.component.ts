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

import {Component, Input, Output, EventEmitter} from '@angular/core';
import {TableHeader} from '../model/table-header';

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
