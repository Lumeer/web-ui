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
import {Attribute} from '../../../core/store/collections/collection';
import {Constraint, ConstraintType, DataValue, UnknownConstraint} from '@lumeer/data-filters';

@Pipe({
  name: 'dataInputEditInfo',
})
export class DataInputEditInfoPipe implements PipeTransform {
  public transform(
    attribute: Attribute,
    dataValue: DataValue,
    editable: boolean,
    editing: boolean
  ): {readonly: boolean; hasValue: boolean; showDataInput: boolean; additionalMargin: boolean; editing: boolean} {
    const constraint: Constraint = attribute?.constraint || new UnknownConstraint();
    const asText = constraint.isTextRepresentation;
    const hasValue = dataValue && !!dataValue.format();
    const readonly = !editable || !editing;

    const forceDataInput = [ConstraintType.Action, ConstraintType.Files, ConstraintType.Text].includes(constraint.type);
    return {
      readonly,
      hasValue,
      showDataInput: forceDataInput || !readonly || (!asText && hasValue),
      additionalMargin: constraint.type === ConstraintType.Select,
      editing,
    };
  }
}
