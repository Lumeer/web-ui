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
import {QueryCondition} from '../../store/navigation/query/query';
import {isNotNullOrUndefined, isNullOrUndefined} from '../../../shared/utils/common.utils';

export function dataValuesMeetConditionByText(
  condition: QueryCondition,
  value: string,
  otherValues: string[]
): boolean {
  switch (condition) {
    case QueryCondition.Equals:
      return value === otherValues[0];
    case QueryCondition.NotEquals:
      return value !== otherValues[0];
    case QueryCondition.Contains:
      return value.includes(otherValues[0]);
    case QueryCondition.NotContains:
      return !value.includes(otherValues[0]);
    case QueryCondition.StartsWith:
      return value.startsWith(otherValues[0]);
    case QueryCondition.EndsWith:
      return value.endsWith(otherValues[0]);
    case QueryCondition.IsEmpty:
      return value.length === 0;
    case QueryCondition.NotEmpty:
      return value.length > 0;
    default:
      return false;
  }
}

export function dataValuesMeetConditionByNumber(
  condition: QueryCondition,
  big: Big,
  otherBigNumbers: Big[],
  value: any,
  otherValues: any[]
): boolean {
  if (!big && !otherBigNumbers[0]) {
    if (condition === QueryCondition.Equals) {
      return (!value && !otherValues[0]) || value === otherValues[0];
    }
  } else if (!big || !otherBigNumbers[0]) {
    if (condition === QueryCondition.NotEquals) {
      return true;
    }
  }

  switch (condition) {
    case QueryCondition.Equals:
      return big && otherBigNumbers[0] && big.eq(otherBigNumbers[0]);
    case QueryCondition.NotEquals:
      return big && otherBigNumbers[0] && !big.eq(otherBigNumbers[0]);
    case QueryCondition.GreaterThan:
      return big && otherBigNumbers[0] && big.gt(otherBigNumbers[0]);
    case QueryCondition.GreaterThanEquals:
      return big && otherBigNumbers[0] && big.gte(otherBigNumbers[0]);
    case QueryCondition.LowerThan:
      return big && otherBigNumbers[0] && big.lt(otherBigNumbers[0]);
    case QueryCondition.LowerThanEquals:
      return big && otherBigNumbers[0] && big.lte(otherBigNumbers[0]);
    case QueryCondition.Between:
      return (
        big && otherBigNumbers[0] && otherBigNumbers[1] && big.gte(otherBigNumbers[0]) && big.lte(otherBigNumbers[1])
      );
    case QueryCondition.NotBetween:
      return (
        big && otherBigNumbers[0] && otherBigNumbers[1] && (big.lt(otherBigNumbers[0]) || big.gt(otherBigNumbers[1]))
      );
    case QueryCondition.IsEmpty:
      return isNullOrUndefined(value) || String(value).trim().length === 0;
    case QueryCondition.NotEmpty:
      return isNotNullOrUndefined(value) && String(value).trim().length > 0;
    default:
      return false;
  }
}

export function valueMeetFulltexts(value: string, fulltexts: string[]): boolean {
  const formattedValue = (value || '').toLowerCase().trim();
  return (fulltexts || [])
    .map(fulltext => fulltext.toLowerCase().trim())
    .every(fulltext => formattedValue.includes(fulltext));
}
