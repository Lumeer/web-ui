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

import * as moment from 'moment';
import {Constraint} from '../../../core/model/constraint';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintType} from '../../../core/model/data/constraint';
import {DateTimeConstraintConfig} from '../../../core/model/data/constraint-config';
import {QueryCondition} from '../../../core/store/navigation/query/query';
import {isNullOrUndefined, isNumeric, toNumber} from '../common.utils';
import {convertToBig, parseMomentDate} from '../data.utils';

export function compareDataValues(a: any, b: any, constraint: Constraint, asc: boolean = true): number {
  const multiplier = asc ? 1 : -1;
  if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
    return 0;
  } else if (isNullOrUndefined(b)) {
    return multiplier;
  } else if (isNullOrUndefined(a)) {
    return -1 * multiplier;
  }

  if (!constraint) {
    return compareAnyValues(a, b, asc);
  }

  switch (constraint.type) {
    case ConstraintType.DateTime:
      return compareDateTimeValues(a, b, constraint.config as DateTimeConstraintConfig, asc);
    case ConstraintType.Percentage:
    case ConstraintType.Number:
      return compareNumericValues(a, b, asc);
    case ConstraintType.Duration:
      return compareDurationValues(a, b, asc);
    default:
      return compareAnyValues(a, b, asc);
  }
}

function compareAnyValues(a: any, b: any, asc: boolean = true): number {
  const multiplier = asc ? 1 : -1;
  const aValue = isNumeric(a) ? toNumber(a) : a;
  const bValue = isNumeric(b) ? toNumber(b) : b;

  if (aValue > bValue) {
    return multiplier;
  } else if (bValue > aValue) {
    return -1 * multiplier;
  }

  return 0;
}

function compareDateTimeValues(a: any, b: any, config: DateTimeConstraintConfig, asc: boolean = true): number {
  const multiplier = asc ? 1 : -1;

  const aMoment = parseMomentDate(a, config && config.format);
  const bMoment = parseMomentDate(b, config && config.format);

  return aMoment.isAfter(bMoment) ? multiplier : bMoment.isAfter(aMoment) ? -1 * multiplier : 0;
}

function compareNumericValues(a: any, b: any, asc: boolean = true): number {
  const multiplier = asc ? 1 : -1;

  const aBig = convertToBig(a);
  const bBig = convertToBig(b);

  if (!aBig && !bBig) {
    return 0;
  } else if (!aBig) {
    return multiplier;
  } else if (!bBig) {
    return -1 * multiplier;
  }

  return multiplier * aBig.cmp(bBig);
}

function compareDurationValues(a: any, b: any, asc: boolean) {
  if (isNumeric(a) && isNumeric(b)) {
    return compareNumericValues(a, b, asc);
  }
  return compareAnyValues(a, b, asc);
}

export function dataValuesMeetCondition(a: any, b: any, condition: QueryCondition, constraint: Constraint): boolean {
  if (constraint && constraint.type === ConstraintType.Boolean) {
    return dataValuesMeetConditionByBoolean(a, b, condition);
  }

  if ((isNullOrUndefined(a) || a === '') && (isNullOrUndefined(b) || b === '')) {
    return condition === QueryCondition.Equals;
  }

  if (isNullOrUndefined(a) || a === '' || (isNullOrUndefined(b) || b === '')) {
    return condition === QueryCondition.NotEquals;
  }

  if (!constraint) {
    return dataValuesMeetConditionByAny(a, b, condition);
  }

  switch (constraint.type) {
    case ConstraintType.DateTime:
      return dataValuesMeetConditionByDateTime(a, b, constraint.config as DateTimeConstraintConfig, condition);
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return dataValuesMeetConditionByNumber(a, b, condition);
    case ConstraintType.Duration:
      return dataValuesMeetConditionDuration(a, b, condition);
    case ConstraintType.User:
      return dataValuesMeetConditionByUser(a, b, condition);
    default:
      return dataValuesMeetConditionByAny(a, b, condition, constraint);
  }
}

function dataValuesMeetConditionByBoolean(a: any, b: any, condition: QueryCondition): boolean {
  switch (condition) {
    case QueryCondition.Equals:
      return !!a === !!b;
    case QueryCondition.NotEquals:
      return !a !== !b;
    default:
      return dataValuesMeetConditionByAny(a, b, condition);
  }
}

function dataValuesMeetConditionByDateTime(
  a: any,
  b: any,
  config: DateTimeConstraintConfig,
  condition: QueryCondition
): boolean {
  const aMoment = parseMomentDateConstraintPriority(a, config);
  const bMoment = parseMomentDateConstraintPriority(b, config);

  switch (condition) {
    case QueryCondition.Equals:
      return aMoment.isSame(bMoment);
    case QueryCondition.NotEquals:
      return !aMoment.isSame(bMoment);
    case QueryCondition.GreaterThan:
      return aMoment.isAfter(bMoment);
    case QueryCondition.GreaterThanEquals:
      return aMoment.isSameOrAfter(bMoment);
    case QueryCondition.LowerThan:
      return aMoment.isBefore(bMoment);
    case QueryCondition.LowerThanEquals:
      return aMoment.isSameOrBefore(bMoment);
    default:
      return true;
  }
}

function parseMomentDateConstraintPriority(value: any, config: DateTimeConstraintConfig): moment.Moment {
  const momentDate = parseMomentDate(value, config && config.format);
  if (config && config.format && momentDate.isValid()) {
    return moment(momentDate.format(config.format), config.format);
  }
  return momentDate;
}

function dataValuesMeetConditionByNumber(a: any, b: any, condition: QueryCondition): boolean {
  const aBig = convertToBig(a);
  const bBig = convertToBig(b);

  if (!aBig && !bBig) {
    return condition === QueryCondition.Equals;
  }

  if (!aBig || !bBig) {
    return condition === QueryCondition.NotEquals;
  }

  switch (condition) {
    case QueryCondition.Equals:
      return aBig.eq(bBig);
    case QueryCondition.NotEquals:
      return !aBig.eq(bBig);
    case QueryCondition.GreaterThan:
      return aBig.gt(bBig);
    case QueryCondition.GreaterThanEquals:
      return aBig.gte(bBig);
    case QueryCondition.LowerThan:
      return aBig.lt(bBig);
    case QueryCondition.LowerThanEquals:
      return aBig.lte(bBig);
    default:
      return true;
  }
}

function dataValuesMeetConditionDuration(a: any, b: any, condition: QueryCondition) {
  if (isNumeric(a) && isNumeric(b)) {
    return dataValuesMeetConditionByNumber(a, b, condition);
  }

  return dataValuesMeetConditionByAny(a, b, condition);
}

function dataValuesMeetConditionByUser(a: any, b: any, condition: QueryCondition): boolean {
  switch (condition) {
    case QueryCondition.Equals:
      return a === b;
    case QueryCondition.NotEquals:
      return a !== b;
    default:
      return true;
  }
}

function dataValuesMeetConditionByAny(a: any, b: any, condition: QueryCondition, constraint?: Constraint): boolean {
  const aValue = (constraint || new UnknownConstraint()).createDataValue(a).format();
  const bValue = (constraint || new UnknownConstraint()).createDataValue(b).format();
  switch (condition) {
    case QueryCondition.Equals:
      return aValue === bValue;
    case QueryCondition.NotEquals:
      return aValue !== bValue;
    case QueryCondition.GreaterThan:
      return aValue > bValue;
    case QueryCondition.GreaterThanEquals:
      return aValue >= bValue;
    case QueryCondition.LowerThan:
      return aValue < bValue;
    case QueryCondition.LowerThanEquals:
      return aValue <= bValue;
    default:
      return true;
  }
}
