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

import {Pipe, PipeTransform} from '@angular/core';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TableSingleColumn} from '../../../../../core/store/tables/table.model';
import {filterLeafColumns, getTableColumnWidth} from '../../../../../core/store/tables/table.utils';
import {DocumentHintColumn} from '../../../../../shared/document-hints/document-hint-column';

@Pipe({
  name: 'documentHintColumns',
})
export class DocumentHintColumnsPipe implements PipeTransform {
  public transform(
    table: TableModel,
    cursor: TableBodyCursor,
    showHiddenColumns: boolean = false
  ): DocumentHintColumn[] {
    return filterLeafColumns(table.parts[cursor.partIndex].columns)
      .filter(column => !(column instanceof TableSingleColumn && !column.attributeId))
      .map(column => ({
        attributeId: (column as TableSingleColumn).attributeId,
        width: getTableColumnWidth(column, showHiddenColumns),
      }));
  }
}
