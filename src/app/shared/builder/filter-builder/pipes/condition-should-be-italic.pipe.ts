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
import {QueryCondition} from '../../../../core/store/navigation/query/query';
import {Constraint} from '../../../../core/model/constraint';
import {ConstraintType} from '../../../../core/model/data/constraint';

@Pipe({
  name: 'conditionShouldBeItalic',
})
export class ConditionShouldBeItalicPipe implements PipeTransform {
  public transform(condition: QueryCondition, constraint: Constraint): boolean {
    if (
      condition &&
      constraint &&
      [ConstraintType.Number, ConstraintType.Percentage, ConstraintType.Duration].includes(constraint.type)
    ) {
      return ![
        QueryCondition.Equals,
        QueryCondition.NotEquals,
        QueryCondition.GreaterThan,
        QueryCondition.GreaterThanEquals,
        QueryCondition.LowerThan,
        QueryCondition.LowerThanEquals,
      ].includes(condition);
    }
    return true;
  }
}
