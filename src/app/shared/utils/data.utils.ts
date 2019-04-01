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
  ColorConstraintConfig,
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
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric, toNumber} from './common.utils';
import {DocumentData} from '../../core/store/documents/document.model';
import {Attribute} from '../../core/store/collections/collection';

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

export function parseColorValue(value: any, colorConstraint?: ColorConstraintConfig): string {
  if (!value) {
    return value;
  }

  return value;
}

function parseMomentDate(value: any, expectedFormat?: string): moment.Moment {
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

export function compareValues(a: any, b: any, constraint: Constraint, asc: boolean = true): number {
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
      return comparePercentageValues(a, b, constraint.config as PercentageConstraintConfig, asc);
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

function comparePercentageValues(a: any, b: any, config: PercentageConstraintConfig, asc: boolean = true): number {
  const multiplier = asc ? 1 : -1;

  const aValue = getPercentageSaveValue(a);
  const bValue = getPercentageSaveValue(b);

  return aValue > bValue ? multiplier : bValue > aValue ? -1 * multiplier : 0;
}

export function formatDataValue(value: any, constraint: Constraint): any {
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
      return formatPercentageDataValue(value, constraint.config as PercentageConstraintConfig);
    case ConstraintType.Color:
      return formatColorDataValue(value, constraint.config as ColorConstraintConfig);
    case ConstraintType.Boolean:
      return !!value && value !== '0';
    default:
      return isNumeric(value) ? toNumber(value) : formatUnknownDataValue(value);
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

export function isDateTimeValid(value: any, config?: DateTimeConstraintConfig): boolean {
  if (!value) {
    return true;
  }

  const momentDate = parseMomentDate(value, config && config.format);
  return momentDate.isValid();
}

export function getDateTimeSaveValue(value: any, config: DateTimeConstraintConfig): string {
  return value ? moment(value, config.format).toISOString() : '';
}

// tslint:disable:max-line-length
// prettier-ignore
const validColors = {'black': '#000000', 'silver': '#c0c0c0', 'gray': '#808080', 'white': '#ffffff', 'maroon': '#800000', 'red': '#ff0000', 'purple': '#800080', 'fuchsia': '#ff00ff', 'green': '#008000', 'lime': '#00ff00', 'olive': '#808000', 'yellow': '#ffff00', 'navy': '#000080', 'blue': '#0000ff', 'teal': '#008080', 'orange': '#ffa500', 'aliceblue': '#f0f8ff', 'antiquewhite': '#faebd7', 'aquamarine': '#7fffd4', 'azure': '#f0ffff', 'beige': '#f5f5dc', 'bisque': '#ffe4c4', 'blanchedalmond': '#ffebcd', 'blueviolet': '#8a2be2', 'brown': '#a52a2a', 'burlywood': '#deb887', 'cadetblue': '#5f9ea0', 'chartreuse': '#7fff00', 'chocolate': '#d2691e', 'coral': '#ff7f50', 'cornflowerblue': '#6495ed', 'cornsilk': '#fff8dc', 'crimson': '#dc143c', 'cyan': '#00ffff', 'aqua': '#00ffff', 'darkblue': '#00008b', 'darkcyan': '#008b8b', 'darkgoldenrod': '#b8860b', 'darkgray': '#a9a9a9', 'darkgreen': '#006400', 'darkgrey': '#a9a9a9', 'darkkhaki': '#bdb76b', 'darkmagenta': '#8b008b', 'darkolivegreen': '#556b2f', 'darkorange': '#ff8c00', 'darkorchid': '#9932cc', 'darkred': '#8b0000', 'darksalmon': '#e9967a', 'darkseagreen': '#8fbc8f', 'darkslateblue': '#483d8b', 'darkslategray': '#2f4f4f', 'darkslategrey': '#2f4f4f', 'darkturquoise': '#00ced1', 'darkviolet': '#9400d3', 'deeppink': '#ff1493', 'deepskyblue': '#00bfff', 'dimgray': '#696969', 'dimgrey': '#696969', 'dodgerblue': '#1e90ff', 'firebrick': '#b22222', 'floralwhite': '#fffaf0', 'forestgreen': '#228b22', 'gainsboro': '#dcdcdc', 'ghostwhite': '#f8f8ff', 'gold': '#ffd700', 'goldenrod': '#daa520', 'greenyellow': '#adff2f', 'grey': '#808080', 'honeydew': '#f0fff0', 'hotpink': '#ff69b4', 'indianred': '#cd5c5c', 'indigo': '#4b0082', 'ivory': '#fffff0', 'khaki': '#f0e68c', 'lavender': '#e6e6fa', 'lavenderblush': '#fff0f5', 'lawngreen': '#7cfc00', 'lemonchiffon': '#fffacd', 'lightblue': '#add8e6', 'lightcoral': '#f08080', 'lightcyan': '#e0ffff', 'lightgoldenrodyellow': '#fafad2', 'lightgray': '#d3d3d3', 'lightgreen': '#90ee90', 'lightgrey': '#d3d3d3', 'lightpink': '#ffb6c1', 'lightsalmon': '#ffa07a', 'lightseagreen': '#20b2aa', 'lightskyblue': '#87cefa', 'lightslategray': '#778899', 'lightslategrey': '#778899', 'lightsteelblue': '#b0c4de', 'lightyellow': '#ffffe0', 'limegreen': '#32cd32', 'linen': '#faf0e6', 'magenta': 'ff00ff', 'mediumaquamarine': '#66cdaa', 'mediumblue': '#0000cd', 'mediumorchid': '#ba55d3', 'mediumpurple': '#9370db', 'mediumseagreen': '#3cb371', 'mediumslateblue': '#7b68ee', 'mediumspringgreen': '#00fa9a', 'mediumturquoise': '#48d1cc', 'mediumvioletred': '#c71585', 'midnightblue': '#191970', 'mintcream': '#f5fffa', 'mistyrose': '#ffe4e1', 'moccasin': '#ffe4b5', 'navajowhite': '#ffdead', 'oldlace': '#fdf5e6', 'olivedrab': '#6b8e23', 'orangered': '#ff4500', 'orchid': '#da70d6', 'palegoldenrod': '#eee8aa', 'palegreen': '#98fb98', 'paleturquoise': '#afeeee', 'palevioletred': '#db7093', 'papayawhip': '#ffefd5', 'peachpuff': '#ffdab9', 'peru': '#cd853f', 'pink': '#ffc0cb', 'plum': '#dda0dd', 'powderblue': '#b0e0e6', 'rosybrown': '#bc8f8f', 'royalblue': '#4169e1', 'saddlebrown': '#8b4513', 'salmon': '#fa8072', 'sandybrown': '#f4a460', 'seagreen': '#2e8b57', 'seashell': '#fff5ee', 'sienna': '#a0522d', 'skyblue': '#87ceeb', 'slateblue': '#6a5acd', 'slategray': '#708090', 'slategrey': '#708090', 'snow': '#fffafa', 'springgreen': '#00ff7f', 'steelblue': '#4682b4', 'tan': '#d2b48c', 'thistle': '#d8bfd8', 'tomato': '#ff6347', 'turquoise': '#40e0d0', 'violet': '#ee82ee', 'wheat': '#f5deb3', 'whitesmoke': '#f5f5f5', 'yellowgreen': '#9acd32', 'rebeccapurple': '#663399' };
// tslint:enable:max-line-length

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
  if (Object.keys(validColors).indexOf(filter) >= 0) {
    return validColors[filter];
  }

  return value;
}

export function isColorValid(value: any, config?: ColorConstraintConfig): boolean {
  const filter = String(value)
    .trim()
    .toLowerCase();

  // color name
  if (Object.keys(validColors).indexOf(filter) >= 0) {
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
