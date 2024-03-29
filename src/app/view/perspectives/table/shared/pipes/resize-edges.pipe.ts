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

import {Edges} from 'angular-resizable-element';

import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {hasLastTableColumnChildHidden, isLastTableColumnChild} from '../../../../../core/store/tables/table.utils';

@Pipe({
  name: 'resizeEdges',
})
export class ResizeEdgesPipe implements PipeTransform {
  public transform(column: TableConfigColumn, table: TableModel, cursor: TableHeaderCursor): Edges {
    const part = table.config.parts[cursor.partIndex];
    const isLastChild = isLastTableColumnChild(part.columns, cursor.columnPath);
    const hasLastChildHidden = hasLastTableColumnChildHidden(column);
    return isLastChild || hasLastChildHidden ? {} : {right: true};
  }
}
