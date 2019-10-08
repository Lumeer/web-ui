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
import * as moment from 'moment';
import {isNullOrUndefined} from './common.utils';
import {resetUnusedMomentPart} from './date.utils';

const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY', 'DD.MM.'];

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

export function parseMomentDate(value: any, expectedFormat?: string): moment.Moment {
  const formats = [moment.ISO_8601, ...dateFormats];
  if (expectedFormat) {
    formats.splice(1, 0, expectedFormat);
  }
  return moment(value, formats);
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
