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
import {TableRow} from '../model/table-row';

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
  @Output() public updateRow: EventEmitter<any> = new EventEmitter();

  public model: string;

  public onEdit(item, index): void {
    let oldValue: string = this.row.cells[index].label.toString().trim();
    let newValue: string = item.toString().trim();
    if (oldValue !== newValue) {
      this.updateRow.emit({colIndex: index, data: newValue});
    }
  }

  public onItemClicked(index): void {
    this.itemHighlight.emit({colIndex: index});
  }

  public highlightNext(event, i: number) {
    // TODO??
  }
}
