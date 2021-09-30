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
import {TableRow} from '../model/table-row';
import {TableColumn} from '../model/table-column';
import {DataCursor} from '../../data-input/data-cursor';

@Pipe({
  name: 'tableRowDataCursor',
})
export class TableRowDataCursorPipe implements PipeTransform {
  public transform(row: TableRow, column: TableColumn, viewId: string): DataCursor {
    if (column?.linkTypeId) {
      return {
        linkTypeId: column.linkTypeId,
        linkInstanceId: row.linkInstanceId,
        attributeId: column.attribute?.id,
        viewId,
      };
    } else if (column?.collectionId) {
      return {
        collectionId: column.collectionId,
        documentId: row.documentId,
        attributeId: column.attribute?.id,
        viewId,
      };
    }
    return {};
  }
}
