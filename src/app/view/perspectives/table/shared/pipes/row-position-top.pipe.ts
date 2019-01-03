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
import {TableConfigRow} from '../../../../../core/store/tables/table.model';
import {countLinkedRows} from '../../../../../core/store/tables/table.utils';

const TABLE_ROW_HEIGHT = 31;

@Pipe({
  name: 'rowPositionTop',
})
export class RowPositionTopPipe implements PipeTransform {
  public transform(rows: TableConfigRow[], rowIndex: number): number {
    if (!rows) {
      return 0;
    }

    return rows.slice(0, rowIndex).reduce((count, row) => count + countLinkedRows(row), 0) * TABLE_ROW_HEIGHT;
  }
}
