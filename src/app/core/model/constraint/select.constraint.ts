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

import {SelectDataValue} from '../data-value/select.data-value';
import {ConstraintType} from '../data/constraint';
import {SelectConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {QueryCondition} from '../../store/navigation/query/query';
import {
  avgAnyValues,
  countValues,
  maxInAnyValues,
  medianInAnyValues,
  minInAnyValues,
  sumAnyValues,
  uniqueValuesCount,
} from './aggregation';

export class SelectConstraint implements Constraint {
  public readonly type = ConstraintType.Select;
  public readonly isTextRepresentation = false;

  constructor(public readonly config: SelectConstraintConfig) {}

  public createDataValue(value: any): SelectDataValue {
    return new SelectDataValue(value, this.config);
  }

  public createInputDataValue(inputValue: string, value: any): SelectDataValue {
    return new SelectDataValue(value, this.config, inputValue);
  }

  public conditions(): QueryCondition[] {
    return [
      QueryCondition.HasSome,
      QueryCondition.HasNoneOf,
      QueryCondition.In,
      QueryCondition.HasAll,
      QueryCondition.IsEmpty,
      QueryCondition.NotEmpty,
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
