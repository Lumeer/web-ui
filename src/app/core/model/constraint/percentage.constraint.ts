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

import {PercentageDataValue} from '../data-value/percentage.data-value';
import {ConstraintType} from '../data/constraint';
import {PercentageConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {QueryCondition} from '../../store/navigation/query/query';

export class PercentageConstraint implements Constraint {
  public readonly type = ConstraintType.Percentage;
  public readonly isTextRepresentation = true;

  constructor(public readonly config: PercentageConstraintConfig) {}

  public createDataValue(value: any): PercentageDataValue {
    return new PercentageDataValue(value, this.config);
  }

  public createInputDataValue(inputValue: string, value: any): PercentageDataValue {
    return new PercentageDataValue(value, this.config, inputValue);
  }

  public conditions(): QueryCondition[] {
    return [
      QueryCondition.Equals,
      QueryCondition.NotEquals,
      QueryCondition.GreaterThan,
      QueryCondition.LowerThan,
      QueryCondition.GreaterThanEquals,
      QueryCondition.LowerThanEquals,
      QueryCondition.Between,
      QueryCondition.NotBetween,
      QueryCondition.IsEmpty,
      QueryCondition.NotEmpty,
    ];
  }
}
