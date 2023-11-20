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

import {AttributeLockFiltersStats, ConstraintData, computeAttributeLockStats} from '@lumeer/data-filters';

import {Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {FormAttributeCellConfig, FormCell, FormCellType} from '../../../../core/store/form/form-model';

@Pipe({
  name: 'formCellLockStats',
})
export class FormCellLockStatsPipe implements PipeTransform {
  public transform(
    cell: FormCell,
    document: DocumentModel,
    collection: Collection,
    constraintData: ConstraintData
  ): AttributeLockFiltersStats {
    if (cell?.type === FormCellType.Attribute) {
      const config = <FormAttributeCellConfig>cell.config;
      const attribute = findAttribute(collection?.attributes, config?.attributeId);
      return computeAttributeLockStats(document || {id: null, data: {}}, collection, attribute?.lock, constraintData);
    }
    return null;
  }
}
