/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {
  Constraint,
  ConstraintType,
  DateTimeConstraintConfig,
  NumberConstraintConfig,
  TextConstraintConfig,
} from '../../core/model/data/constraint';
import * as moment from 'moment';
import {transformTextBasedOnCaseStyle} from './string.utils';

export function formatDataValue(value: any, constraint: Constraint): string {
  if (!constraint) {
    return formatUnknownDataValue(value);
  }

  switch (constraint.type) {
    case ConstraintType.DateTime:
      return formatDateTimeDataValue(value, constraint.config as DateTimeConstraintConfig);
    case ConstraintType.Number:
      return formatNumberDataValue(value, constraint.config as NumberConstraintConfig);
    case ConstraintType.Text:
      return formatTextDataValue(value, constraint.config as TextConstraintConfig);
    default:
      return formatUnknownDataValue(value);
  }
}

export function formatDateTimeDataValue(value: any, config: DateTimeConstraintConfig): string {
  if (typeof value !== 'string') {
    return !value && value !== 0 ? '' : value;
  }

  const date = new Date(value);

  if (date.toString() === 'Invalid Date') {
    return value;
  }

  return config && config.format ? moment(date).format(config.format) : date.toLocaleString();
}

export function formatNumberDataValue(value: any, config: NumberConstraintConfig): string {
  // TODO format based on config
  return formatUnknownDataValue(value);
}

export function formatTextDataValue(value: any, config?: TextConstraintConfig): string {
  if (typeof value !== 'string' || !config) {
    return formatUnknownDataValue(value);
  }
  return transformTextBasedOnCaseStyle(value, config && config.caseStyle);
}

export function formatUnknownDataValue(value: any): string {
  return value || value === 0 ? String(value) : '';
}
