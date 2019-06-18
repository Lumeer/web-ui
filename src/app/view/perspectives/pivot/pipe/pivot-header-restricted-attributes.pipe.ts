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
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {SelectItemWithConstraintItemId} from '../../../../shared/select/select-constraint-item/select-item-with-constraint.component';

@Pipe({
  name: 'pivotHeaderRestrictedAttributes',
})
export class PivotHeaderRestrictedAttributesPipe implements PipeTransform {
  public transform(
    pivotRowColumnAttributes: PivotRowColumnAttribute[],
    currentRowColumnAttribute: PivotRowColumnAttribute
  ): SelectItemWithConstraintItemId[] {
    return (pivotRowColumnAttributes || [])
      .filter(attribute => !currentRowColumnAttribute || !deepObjectsEquals(attribute, currentRowColumnAttribute))
      .map(attribute => ({resourceIndex: attribute.resourceIndex, attributeId: attribute.attributeId}));
  }
}
