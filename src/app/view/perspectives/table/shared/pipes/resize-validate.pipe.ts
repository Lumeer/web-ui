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
import {ResizeEvent} from 'angular-resizable-element';
import {TableCompoundColumn} from '../../../../../core/store/tables/table.model';
import {getTableColumnWidth, hasTableColumnChildren} from '../../../../../core/store/tables/table.utils';
import {getLastFromArray} from '../../../../../shared/utils/array.utils';

const MIN_COLUMN_WIDTH = 30;

@Pipe({
  name: 'resizeValidate',
})
export class ResizeValidatePipe implements PipeTransform {
  public transform(column: TableCompoundColumn, showHiddenColumns: boolean = false): (event: ResizeEvent) => boolean {
    return (event: ResizeEvent) => {
      if (!hasTableColumnChildren(column)) {
        return event.rectangle.width >= MIN_COLUMN_WIDTH;
      }

      const lastChild = getLastFromArray(column.children);
      const lastChildWidth = getTableColumnWidth(lastChild, showHiddenColumns);
      const delta = Number(event.edges.right);
      return lastChildWidth + delta >= MIN_COLUMN_WIDTH;
    };
  }
}
