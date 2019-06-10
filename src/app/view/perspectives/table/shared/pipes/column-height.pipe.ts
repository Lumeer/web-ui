/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Pipe, PipeTransform} from '@angular/core';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {calculateColumnRowspan} from '../../../../../core/store/tables/table.utils';

export const TABLE_ROW_HEIGHT = 35;

@Pipe({
  name: 'columnHeight',
})
export class ColumnHeightPipe implements PipeTransform {
  public transform(column: TableConfigColumn, table: TableModel, cursor: TableHeaderCursor): number {
    if (column.children.length) {
      return TABLE_ROW_HEIGHT;
    }

    const rowspan =
      calculateColumnRowspan(table, cursor.partIndex, cursor.columnPath.slice(0, cursor.columnPath.length - 1)) || 1;
    return rowspan * TABLE_ROW_HEIGHT;
  }
}
