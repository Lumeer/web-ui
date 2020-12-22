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

import {UserDataValue} from '../data-value/user.data-value';
import {ConstraintData, ConstraintType} from '../data/constraint';
import {UserConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {
  avgAnyValues,
  countValues,
  maxInAnyValues,
  medianInAnyValues,
  minInAnyValues,
  sumAnyValues,
  uniqueValuesCount,
} from './aggregation';
import {ConditionType} from '../attribute-filter';

export class UserConstraint implements Constraint {
  public readonly type = ConstraintType.User;
  public readonly isTextRepresentation = false;

  constructor(public readonly config: UserConstraintConfig) {}

  public createDataValue(value: any, constraintData: ConstraintData): UserDataValue {
    return new UserDataValue(value, this.config, constraintData);
  }

  public createInputDataValue(inputValue: string, value: any, constraintData: ConstraintData): UserDataValue {
    return new UserDataValue(value, this.config, constraintData, inputValue);
  }

  public conditions(): ConditionType[] {
    return [
      ConditionType.HasSome,
      ConditionType.HasNoneOf,
      ConditionType.In,
      ConditionType.HasAll,
      ConditionType.IsEmpty,
      ConditionType.NotEmpty,
    ];
  }

  public avg(values: any[], onlyNumeric?: boolean): any {
    return avgAnyValues(values, onlyNumeric);
  }

  public max(values: any[], onlyNumeric?: boolean): any {
    return maxInAnyValues(values, onlyNumeric);
  }

  public median(values: any[], onlyNumeric?: boolean): any {
    return medianInAnyValues(values, onlyNumeric);
  }

  public min(values: any[], onlyNumeric?: boolean): any {
    return minInAnyValues(values, onlyNumeric);
  }

  public sum(values: any[], onlyNumeric?: boolean): any {
    return sumAnyValues(values, onlyNumeric);
  }

  public unique(values: any[]): any {
    return uniqueValuesCount(values);
  }

  public count(values: any[]): number {
    return countValues(values);
  }
}
