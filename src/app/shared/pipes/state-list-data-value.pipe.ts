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

import {Constraint, ConstraintData, ConstraintType, DataValue, UnknownConstraint} from '@lumeer/data-filters';

@Pipe({
  name: 'stateListDataValue',
})
// used with StateListConstraintPipe
export class StateListDataValuePipe implements PipeTransform {
  public transform(stateList: any[], constraint: Constraint, constraintData?: ConstraintData): DataValue {
    let value = stateList;

    if (constraint?.type === ConstraintType.Boolean) {
      value = stateList?.[0];
    }

    // other constraints which are used in state list (User, Select) support array values
    return (constraint || new UnknownConstraint()).createDataValue(value, constraintData);
  }
}
