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

import {CoordinatesDataValue} from '../data-value/coordinates.data-value';
import {ConstraintType} from '../data/constraint';
import {CoordinatesConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {avgAnyValues, countValues, medianInAnyValues, sumAnyValues, uniqueValuesCount} from './aggregation';
import {DataValue} from '../data-value';
import {ConditionType} from '../attribute-filter';

export class CoordinatesConstraint implements Constraint {
  public readonly type = ConstraintType.Coordinates;
  public readonly isTextRepresentation = true;

  constructor(public readonly config: CoordinatesConstraintConfig) {}

  public createDataValue(value: any): CoordinatesDataValue {
    return new CoordinatesDataValue(value, this.config);
  }

  public createInputDataValue(inputValue: string, value: any): CoordinatesDataValue {
    return new CoordinatesDataValue(value, this.config, inputValue);
  }

  public conditions(): ConditionType[] {
    return [ConditionType.Equals, ConditionType.NotEquals, ConditionType.IsEmpty, ConditionType.NotEmpty];
  }

  public avg(values: any[], onlyNumeric?: boolean): any {
    return avgAnyValues(values, onlyNumeric);
  }

  public max(values: any[], onlyNumeric?: boolean): any {
    return this.sortedValues(values, true)[0]?.serialize();
  }

  public median(values: any[], onlyNumeric?: boolean): any {
    return medianInAnyValues(values, onlyNumeric);
  }

  public min(values: any[], onlyNumeric?: boolean): any {
    return this.sortedValues(values)[0]?.serialize();
  }

  private sortedValues(values: any[], desc?: boolean): DataValue[] {
    return values.map(value => this.createDataValue(value)).sort((a, b) => a.compareTo(b) * (desc ? -1 : 1));
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
