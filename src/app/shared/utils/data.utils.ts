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
  PercentageConstraintConfig,
  TextConstraintConfig,
} from '../../core/model/data/constraint';
import * as moment from 'moment';
import {transformTextBasedOnCaseStyle} from './string.utils';
import Big from 'big.js';
import {isNullOrUndefined} from './common.utils';

const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY'];
const truthyValues = [true, 'true', 'yes', 'ja', 'ano', 'áno', 'sí', 'si', 'sim', 'да', '是', 'はい', 'vâng', 'כן'];

export function parseBooleanDataValue(value: any): boolean {
  return truthyValues.includes(typeof value === 'string' ? value.toLocaleLowerCase() : value);
}

export function parseDateTimeDataValue(value: any, expectedFormat?: string): Date {
  if (!value) {
    return value;
  }

  const momentDate = parseMomentDate(value, expectedFormat);
  return momentDate.isValid() ? momentDate.toDate() : null;
}

function parseMomentDate(value: any, expectedFormat?: string): moment.Moment {
  const formats = [moment.ISO_8601, ...dateFormats];
  if (expectedFormat) {
    formats.splice(1, 0, expectedFormat);
  }
  return moment(value, formats);
}

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

export function formatDateTimeDataValue(value: any, config: DateTimeConstraintConfig, showInvalid = true): string {
  if ([undefined, null, ''].includes(value)) {
    return '';
  }

  const momentDate = parseMomentDate(value, config && config.format);

  if (!momentDate.isValid()) {
    return showInvalid ? formatUnknownDataValue(value, true) : '';
  }

  return config && config.format ? momentDate.format(config.format) : formatUnknownDataValue(value);
}

export function formatNumberDataValue(value: any, config: NumberConstraintConfig): string {
  // TODO format based on config
  if ([undefined, null, ''].includes(value)) {
    return '';
  }
  const valueBig = convertToBig(value);
  if (valueBig) {
    return decimalStoreToUser(valueBig.toFixed());
  }
  return formatUnknownDataValue(value);
}

export function formatPercentageDataValue(value: any, config: PercentageConstraintConfig, suffix = ''): string {
  if ([undefined, null, ''].includes(value)) {
    return '';
  }

  if (typeof value === 'number') {
    return convertPercentageValue(String(value), config.decimals, suffix) + suffix;
  }

  if (typeof value !== 'string' || !config) {
    return formatUnknownDataValue(value);
  }

  const percChars = (value.match(/%/g) || []).length;

  if (percChars === 1 && value.endsWith('%')) {
    const prefix = value.substring(0, value.length - 1);

    if (!isNaN(+prefix)) {
      return prefix + suffix;
    }
  } else if (percChars === 0) {
    if (!isNaN(+value)) {
      return convertPercentageValue(value, config.decimals, suffix) + suffix;
    }
  }

  return formatUnknownDataValue(value);
}

function convertPercentageValue(value: string, decimals?: number, suffix = ''): string {
  let big = new Big(value);
  big.e = big.e + 2;

  // prevents extra zeroes after moving the decimal point
  if (big.eq('0')) {
    big = new Big('0');
  }

  if (![undefined, null].includes(decimals)) {
    big = big.round(decimals);

    if (big.eq('0') && decimals > 0 && suffix) {
      return decimalStoreToUser('0.' + '0'.repeat(decimals));
    }
  }

  return decimalStoreToUser(big.toString());
}

export function formatTextDataValue(value: any, config?: TextConstraintConfig): string {
  if (typeof value !== 'string' || !config) {
    return formatUnknownDataValue(value, true);
  }
  return transformTextBasedOnCaseStyle(value, config && config.caseStyle);
}

export function formatUnknownDataValue(value: any, skipDecimal = false): string {
  if (value || value === 0) {
    if (!skipDecimal && !isNaN(+value)) {
      return decimalStoreToUser(String(value));
    }

    return String(value);
  }

  return '';
}

const separator = (1.1).toLocaleString(window.navigator.language).substring(1, 2);

export function decimalSeparator(): string {
  return separator;
}

export function decimalUserToStore(value: string): string {
  return separator === '.' ? value : value.replace(separator, '.');
}

export function decimalStoreToUser(value: string): string {
  return separator === '.' ? value : value.replace('.', separator);
}

export function convertToBig(value: any): Big {
  if (isNullOrUndefined(value) || value === '') {
    return null;
  }
  try {
    return new Big(decimalUserToStore(String(value)));
  } catch (e) {
    return null;
  }
}

export function isNumberValid(value: any, config?: NumberConstraintConfig): boolean {
  if (!value) {
    return true;
  }
  const valueBig = convertToBig(value);
  if (!valueBig) {
    return false;
  }
  return checkNumberRange(valueBig, config);
}

function checkNumberRange(n: Big, config?: NumberConstraintConfig): boolean {
  let passed = true;
  if (config.minValue) {
    passed = n.gte(config.minValue);
  }
  if (config.maxValue) {
    passed = passed && n.lte(config.maxValue);
  }

  return passed;
}

export function isPercentageValid(value: any, config?: PercentageConstraintConfig): boolean {
  if (!value || typeof value === 'number') {
    return true;
  }

  if (typeof value === 'string') {
    const text = decimalUserToStore(value.trim());

    const percChars = (text.match(/%/g) || []).length;
    if (percChars === 1 && text.endsWith('%')) {
      const prefix = text.substring(0, text.length - 1);
      return checkPercentageNumber(prefix, config);
    } else if (percChars === 0) {
      return checkPercentageNumber(text, config);
    }
  }

  return false;
}

function checkPercentageNumber(value: string, config?: PercentageConstraintConfig): boolean {
  if (!isNaN(+value)) {
    try {
      new Big(value);
    } catch (e) {
      return false;
    }

    return checkPercentageRange(+value, config);
  }

  return false;
}

function checkPercentageRange(n: number, config?: PercentageConstraintConfig): boolean {
  let passed = true;
  if (config.minValue || config.minValue === 0) {
    passed = n >= config.minValue;
  }
  if (config.maxValue || config.maxValue === 0) {
    passed = passed && n <= config.maxValue;
  }

  return passed;
}
