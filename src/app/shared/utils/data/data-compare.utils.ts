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

import {Constraint} from '../../../core/model/constraint';
import {ConstraintType} from '../../../core/model/data/constraint';
import {DateTimeConstraintConfig} from '../../../core/model/data/constraint-config';
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
