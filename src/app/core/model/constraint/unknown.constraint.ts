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

import {UnknownDataValue} from '../data-value/unknown.data-value';
import {ConstraintType} from '../data/constraint';
import {Constraint} from './index';
import {QueryCondition} from '../../store/navigation/query/query';

export class UnknownConstraint implements Constraint {
  public readonly type = ConstraintType.Unknown;
  public readonly config = {};
  public readonly isTextRepresentation = true;

  public createDataValue(value: any): UnknownDataValue {
    return new UnknownDataValue(value);
  }

  public createInputDataValue(inputValue: string, value: any): UnknownDataValue {
    return new UnknownDataValue(value, inputValue);
  }

  public conditions(): QueryCondition[] {
    return [
      QueryCondition.Equals,
      QueryCondition.NotEquals,
      QueryCondition.Contains,
      QueryCondition.NotContains,
      QueryCondition.StartsWith,
      QueryCondition.EndsWith,
      QueryCondition.IsEmpty,
      QueryCondition.NotEmpty,
    ];
  }
}
