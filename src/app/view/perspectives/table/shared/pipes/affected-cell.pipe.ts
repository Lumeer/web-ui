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
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {LinkInstanceModel} from '../../../../../core/store/link-instances/link-instance.model';
import {TableSingleColumn} from '../../../../../core/store/tables/table.model';
import {EditedAttribute} from '../../../../../core/store/tables/tables.state';

@Pipe({
  name: 'affectedCell',
})
export class AffectedCellPipe implements PipeTransform {
  public transform(
    editedAttribute: EditedAttribute,
    entities: (DocumentModel | LinkInstanceModel)[],
    column: TableSingleColumn
  ): boolean {
    return (
      editedAttribute &&
      entities &&
      column &&
      editedAttribute.attributeId === column.attributeId &&
      entities.some(
        entity =>
          entity.id && (editedAttribute.documentId === entity.id || editedAttribute.linkInstanceId === entity.id)
      )
    );
  }
}
