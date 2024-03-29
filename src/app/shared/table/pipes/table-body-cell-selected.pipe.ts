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

import {TableColumn} from '../model/table-column';
import {TableCell, TableCellType} from '../model/table-model';
import {TableRow} from '../model/table-row';
import {isTableCellSelected, isTableColumnDirectlyEditable} from '../model/table-utils';

@Pipe({
  name: 'tableBodyCellSelected',
})
export class TableBodyCellSelectedPipe implements PipeTransform {
  public transform(
    selectedCell: TableCell,
    editedCell: TableCell,
    column: TableColumn,
    type: TableCellType,
    row?: TableRow
  ): boolean {
    return (
      isTableCellSelected(selectedCell, column, type, row) ||
      (isTableCellSelected(editedCell, column, type, row) && isTableColumnDirectlyEditable(column))
    );
  }
}
