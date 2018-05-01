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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel, TableRow} from '../../../../../../../core/store/tables/table.model';
import {calculateRowNumber, countLinkedRows} from '../../../../../../../core/store/tables/table.utils';

@Component({
  selector: 'table-row-numbers',
  templateUrl: './table-row-numbers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableRowNumbersComponent {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableRow;

  public rowNumberWidth(): string {
    return `${this.table.rowNumberWidth}px`;
  }

  public rowNumbers(): number[] {
    if (!this.cursor.rowPath || this.cursor.rowPath.length !== 1) {
      return [];
    }

    const firstRowNumber = calculateRowNumber(this.table, this.cursor.rowPath[0]);
    const rowsCount = countLinkedRows(this.row);
    const indexes = Array.from(Array(rowsCount).keys());
    return indexes.map(index => firstRowNumber + index);
  }

  public rowIndexes(): number[] {
    const rowsCount = countLinkedRows(this.row);
    return Array.from(Array(rowsCount).keys());
  }

}
