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

import Big from 'big.js';
import {isNotNullOrUndefined, isNullOrUndefined} from '../../../shared/utils/common.utils';
import {setCharAt} from '../../../shared/utils/string.utils';
import {NumericDataValue} from './index';
import {ConditionType, ConditionValue} from '../attribute-filter';
import {conditionNumInputs} from '../../store/navigation/query/query.util';
import {ConstraintType} from '../data/constraint';
import {createRange} from '../../../shared/utils/array.utils';
import {Constraint} from '../constraint';

export function dataValuesMeetConditionByText(condition: ConditionType, value: string, otherValues: string[]): boolean {
  switch (condition) {
    case ConditionType.Equals:
      return value === otherValues[0];
    case ConditionType.NotEquals:
      return value !== otherValues[0];
    case ConditionType.Contains:
      return value.includes(otherValues[0]);
    case ConditionType.NotContains:
      return !value.includes(otherValues[0]);
    case ConditionType.StartsWith:
      return value.startsWith(otherValues[0]);
    case ConditionType.EndsWith:
      return value.endsWith(otherValues[0]);
    case ConditionType.IsEmpty:
      return value.length === 0;
    case ConditionType.NotEmpty:
      return value.length > 0;
    default:
      return false;
  }
}

export function valueByConditionText(condition: ConditionType, value: any): any {
  switch (condition) {
    case ConditionType.Equals:
    case ConditionType.Contains:
    case ConditionType.StartsWith:
    case ConditionType.EndsWith:
      return value;
    case ConditionType.NotEquals:
      return value ? '' : 'a';
    case ConditionType.NotContains:
      return createValueNotIncludes(value);
    case ConditionType.NotEmpty:
      return 'a';
    case ConditionType.IsEmpty:
      return '';
    default:
      return '';
  }
}

function createValueNotIncludes(value: string): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let createdValue = '';
  let position = 0;
  while (value.includes(createdValue)) {
    for (let i = 0; i < letters.length; i++) {
      createdValue = setCharAt(createdValue, position, letters[i]);
      if (!value.includes(createdValue)) {
        break;
      }
    }

    position++;
  }

  return createdValue;
}

export function dataValuesMeetConditionByNumber(
  condition: ConditionType,
  big: Big,
  otherBigNumbers: Big[],
  value: any,
  otherValues: any[]
): boolean {
  if (!big && !otherBigNumbers[0]) {
    if (condition === ConditionType.Equals) {
      return (!value && !otherValues[0]) || value === otherValues[0];
    }
  } else if (!big || !otherBigNumbers[0]) {
    if (condition === ConditionType.NotEquals) {
      return true;
    }
  }

  switch (condition) {
    case ConditionType.Equals:
      return big && otherBigNumbers[0] && big.eq(otherBigNumbers[0]);
    case ConditionType.NotEquals:
      return big && otherBigNumbers[0] && !big.eq(otherBigNumbers[0]);
    case ConditionType.GreaterThan:
      return big && otherBigNumbers[0] && big.gt(otherBigNumbers[0]);
    case ConditionType.GreaterThanEquals:
      return big && otherBigNumbers[0] && big.gte(otherBigNumbers[0]);
    case ConditionType.LowerThan:
      return big && otherBigNumbers[0] && big.lt(otherBigNumbers[0]);
    case ConditionType.LowerThanEquals:
      return big && otherBigNumbers[0] && big.lte(otherBigNumbers[0]);
    case ConditionType.Between:
      return (
        big && otherBigNumbers[0] && otherBigNumbers[1] && big.gte(otherBigNumbers[0]) && big.lte(otherBigNumbers[1])
      );
    case ConditionType.NotBetween:
      return (
        big && otherBigNumbers[0] && otherBigNumbers[1] && (big.lt(otherBigNumbers[0]) || big.gt(otherBigNumbers[1]))
      );
    case ConditionType.IsEmpty:
      return isNullOrUndefined(value) || String(value).trim().length === 0;
    case ConditionType.NotEmpty:
      return isNotNullOrUndefined(value) && String(value).trim().length > 0;
    default:
      return false;
  }
}

export function valueByConditionNumber(
  dataValue: NumericDataValue,
  condition: ConditionType,
  values: ConditionValue[],
  exampleValue: any,
  divider = 1
): any {
  switch (condition) {
    case ConditionType.Equals:
    case ConditionType.GreaterThanEquals:
    case ConditionType.LowerThanEquals:
      return values[0].value;
    case ConditionType.NotEquals:
      return values[0].value ? '' : exampleValue;
    case ConditionType.LowerThan:
    case ConditionType.NotBetween:
      return dataValue.copy(values[0].value).decrement().serialize();
    case ConditionType.GreaterThan:
      return dataValue.copy(values[0].value).increment().serialize();
    case ConditionType.Between:
      const firstValue = (<NumericDataValue>dataValue.copy(values[0].value)).bigNumber;
      const secondValue = (<NumericDataValue>dataValue.copy(values[1].value)).bigNumber;
      if (firstValue && secondValue) {
        const firstValueDivided = firstValue.div(new Big(divider));
        const bigValue = firstValueDivided
          .minus(secondValue.div(new Big(divider)))
          .abs()
          .div(new Big(2))
          .plus(firstValueDivided);
        return dataValue.copy(bigValue.toFixed()).serialize();
      }
      return values[0].value || values[1].value;
    case ConditionType.IsEmpty:
      return '';
    case ConditionType.NotEmpty:
      return exampleValue;
    default:
      return '';
  }
}

export function valueMeetFulltexts(value: string, fulltexts: string[]): boolean {
  const formattedValue = (value || '').toLowerCase().trim();
  return (fulltexts || [])
    .map(fulltext => fulltext.toLowerCase().trim())
    .every(fulltext => formattedValue.includes(fulltext));
}

export function initialConditionType(constraint: Constraint): ConditionType {
  return constraint.conditions()[0];
}

export function initialConditionValues(condition: ConditionType, constraint: Constraint): ConditionValue[] {
  const numInputs = conditionNumInputs(condition);
  switch (constraint.type) {
    case ConstraintType.Boolean:
      return createRange(0, numInputs).map(() => ({value: true}));
    default:
      return createRange(0, numInputs).map(() => ({}));
  }
}
