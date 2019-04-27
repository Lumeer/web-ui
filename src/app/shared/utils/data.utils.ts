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

import Big from 'big.js';
import * as moment from 'moment';
import {
  ColorConstraintConfig,
  Constraint,
  ConstraintType,
  DateTimeConstraintConfig,
  NumberConstraintConfig,
  PercentageConstraintConfig,
  TextConstraintConfig,
  UserConstraintConfig,
} from '../../core/model/data/constraint';
import {Attribute} from '../../core/store/collections/collection';
import {DocumentData} from '../../core/store/documents/document.model';
import {User} from '../../core/store/users/user';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric, toNumber} from './common.utils';
import {validDataColors} from './data/valid-data-colors';
import {resetUnusedMomentPart} from './date.utils';
import {transformTextBasedOnCaseStyle} from './string.utils';

const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY', 'DD.MM.'];
const truthyValues = [true, 'true', 'yes', 'ja', 'ano', 'áno', 'sí', 'si', 'sim', 'да', '是', 'はい', 'vâng', 'כן'];

export function parseBooleanDataValue(value: any): boolean {
  return truthyValues.includes(typeof value === 'string' ? value.toLocaleLowerCase() : value);
}

export function parseDateTimeDataValue(value: any, expectedFormat?: string): Date {
  if (!value) {
    return value;
  }

  const momentDate = parseMomentDate(value, expectedFormat);
  if (!momentDate.isValid()) {
    return null;
  }

  return resetUnusedMomentPart(momentDate, expectedFormat).toDate();
}

export function parseColorValue(value: any, colorConstraint?: ColorConstraintConfig): string {
  if (!value) {
    return value;
  }

  return value;
}

export function parseMomentDate(value: any, expectedFormat?: string): moment.Moment {
  const formats = [moment.ISO_8601, ...dateFormats];
  if (expectedFormat) {
    formats.splice(1, 0, expectedFormat);
  }
  return moment(value, formats);
}

export function getSaveValue(value: any, constraint: Constraint): any {
  if (!constraint) {
    return value;
  }

  switch (constraint.type) {
    case ConstraintType.Percentage:
      return getPercentageSaveValue(value);
    case ConstraintType.Number:
      return getNumberSaveValue(value);
    case ConstraintType.DateTime:
      return getDateTimeSaveValue(value, constraint.config as DateTimeConstraintConfig);
    case ConstraintType.Boolean:
      return parseBooleanDataValue(value);
    case ConstraintType.Color:
      return formatColorDataValue(value, constraint.config as ColorConstraintConfig);
    default:
      return value;
  }
}

export function formatData(data: DocumentData, attributes: Attribute[], filterInvalid?: boolean): DocumentData {
  const idsMap: Record<string, Attribute> = (attributes || []).reduce((map, attr) => ({...map, [attr.id]: attr}), {});
  const newData = {};
  for (const [attributeId, attribute] of Object.entries(idsMap)) {
    const formattedValue = formatDataValue(data[attributeId], attribute.constraint);
    if (!filterInvalid || isValueValid(formattedValue, attribute.constraint, true)) {
      newData[attributeId] = formattedValue;
    }
  }
  return newData;
}

export function isValueValid(value: any, constraint: Constraint, withoutConfig?: boolean): boolean {
  if (!constraint) {
    return true;
  }

  switch (constraint.type) {
    case ConstraintType.DateTime:
      return isDateTimeValid(value, !withoutConfig ? (constraint.config as DateTimeConstraintConfig) : null);
    case ConstraintType.Number:
      return isNumberValid(value, !withoutConfig ? (constraint.config as NumberConstraintConfig) : null);
    case ConstraintType.Percentage:
      return isPercentageValid(value, !withoutConfig ? (constraint.config as PercentageConstraintConfig) : null);
    case ConstraintType.Color:
      return isColorValid(value, !withoutConfig ? (constraint.config as ColorConstraintConfig) : null);
    default:
      return true;
  }
}

export function formatDataValue(value: any, constraint?: Constraint): any {
  if (!constraint) {
    return isNumeric(value) ? toNumber(value) : formatUnknownDataValue(value);
  }

  switch (constraint.type) {
    case ConstraintType.DateTime:
      return formatDateTimeDataValue(value, constraint.config as DateTimeConstraintConfig);
    case ConstraintType.Number:
      return formatNumberDataValue(value, constraint.config as NumberConstraintConfig);
    case ConstraintType.Text:
      return formatTextDataValue(value, constraint.config as TextConstraintConfig);
    case ConstraintType.Percentage:
      return formatPercentageDataValue(value, constraint.config as PercentageConstraintConfig, '%');
    case ConstraintType.Color:
      return formatColorDataValue(value, constraint.config as ColorConstraintConfig);
    case ConstraintType.Boolean:
      return !!value && value !== '0';
    case ConstraintType.User:
    // we need to figure out how to format values dependant on external data
    default:
      return isNumeric(value) ? toNumber(value) : formatUnknownDataValue(value);
  }
}

export function formatDateTimeDataValue(
  value: any,
  config: Partial<DateTimeConstraintConfig>,
  showInvalid = true
): string {
  if ([undefined, null, ''].includes(value)) {
    return '';
  }

  const momentDate = parseMomentDate(value, config && config.format);

  if (!momentDate.isValid()) {
    return showInvalid ? formatUnknownDataValue(value, true) : '';
  }

  return config && config.format ? momentDate.format(config.format) : formatUnknownDataValue(value);
}

export function isDateTimeValid(value: any, config?: DateTimeConstraintConfig): boolean {
  if (!value) {
    return true;
  }

  const momentDate = parseMomentDate(value, config && config.format);
  return momentDate.isValid();
}

export function getDateTimeSaveValue(value: any, config: DateTimeConstraintConfig): string {
  return value ? resetUnusedMomentPart(moment(value, config.format), config.format).toISOString() : '';
}

export function formatColorDataValue(value: any, config: ColorConstraintConfig, showInvalid = true): string {
  if ([undefined, null, ''].includes(value)) {
    return '';
  }

  if (typeof value !== 'string' || !config) {
    return formatUnknownDataValue(value);
  }

  // color name
  const filter = String(value)
    .trim()
    .toLowerCase();
  if (Object.keys(validDataColors).indexOf(filter) >= 0) {
    return validDataColors[filter];
  }

  return value;
}

export function isColorValid(value: any, config?: ColorConstraintConfig): boolean {
  const filter = String(value)
    .trim()
    .toLowerCase();

  // color name
  if (Object.keys(validDataColors).indexOf(filter) >= 0) {
    return true;
  }

  // rgb code
  if (filter.startsWith('rgb(') && filter.endsWith(')')) {
    const codes = filter
      .replace('rgb(', '')
      .replace(')', '')
      .split(',')
      .map(val => val.trim());
    return checkRgbCode(codes);
  }

  // hsl code
  if (filter.startsWith('hsl(') && filter.endsWith(')')) {
    const codes = filter
      .replace('hsl(', '')
      .replace(')', '')
      .split(',')
      .map(val => val.trim());
    return checkHslCode(codes);
  }

  // hex
  const hex = filter.replace(/[^a-fA-F0-9#]/g, '');
  if (hex === filter) {
    const correction = hex.startsWith('#') ? 1 : 0;
    if (hex.length === 3 + correction || hex.length === 6 + correction || hex.length === 8 + correction) {
      return true;
    }
  }

  return false;
}

function checkRgbCode(codes: string[]): boolean {
  if (codes.length === 3) {
    let result = true;
    codes.forEach(val => {
      if (!val || isNaN(+val) || +val > 255 || +val < 0) {
        result = false;
      }
    });

    return result;
  }

  return false;
}

function checkHslCode(codes: string[]): boolean {
  if (codes.length === 3) {
    const c0 = codes[0];
    if (!c0 || isNaN(+c0) || +c0 > 360 || +c0 < 0) {
      return false;
    }

    let result = true;
    [codes[1], codes[2]].forEach(val => {
      if (!val.endsWith('%')) {
        result = false;
      }
      const c = val.replace('%', '');
      if (!c || isNaN(+c) || +c > 100 || +c < 0) {
        result = false;
      }
    });

    return result;
  }

  return false;
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

export function getNumberSaveValue(value: any): string {
  return decimalUserToStore(String(value).trim());
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

  return formatPercentageStringValue(value, config, suffix);
}

export function formatPercentageStringValue(value: string, config: PercentageConstraintConfig, suffix = ''): string {
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

  if (isNotNullOrUndefined(decimals)) {
    big = big.round(decimals);

    if (big.eq('0') && decimals > 0 && suffix) {
      return decimalStoreToUser('0.' + '0'.repeat(decimals));
    }
  }

  return decimalStoreToUser(big.toString());
}

export function getPercentageSaveValue(value: any): number | string {
  const text = decimalUserToStore(String(value).trim());
  if (text.endsWith('%')) {
    const prefix = text.substring(0, text.length - 1);
    if (isNumeric(prefix)) {
      try {
        return moveDecimalComma(toNumber(prefix), -2);
      } catch (e) {
        return value;
      }
    }
  } else {
    if (text !== undefined && text.length === 0) {
      return '';
    }
    if (isNumeric(text)) {
      try {
        return moveDecimalComma(toNumber(text), -2);
      } catch (e) {
        return text;
      }
    }
  }

  return String(value);
}

function moveDecimalComma(value: any, offset: number): string {
  const big = new Big(value);
  big.e = big.e + offset;
  return big.toString();
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
  if (config && config.minValue) {
    passed = n.gte(config.minValue);
  }
  if (config && config.maxValue) {
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
  if (config && (config.minValue || config.minValue === 0)) {
    passed = n >= config.minValue;
  }
  if (config && (config.maxValue || config.maxValue === 0)) {
    passed = passed && n <= config.maxValue;
  }

  return passed;
}

export function formatUserDataValue(value: any, config: UserConstraintConfig, users: User[]): string {
  const userNames = String(value)
    .split(',')
    .map(email => email.trim())
    .map(email => users.find(user => user.email === email))
    .filter(user => !!user)
    .map(user => user.name || user.email)
    .join(', ');
  return userNames || formatUnknownDataValue(value);
}
