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
import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import isNil from 'lodash/isNil';
import cloneDeep from 'lodash/cloneDeep';

export function isNullOrUndefined(object: any): object is null | undefined {
  return object === null || object === undefined;
}

export function isNotNullOrUndefined(object: any): boolean {
  return !isNullOrUndefined(object);
}

export function isNumeric(value: any): boolean {
  if (typeof value === 'boolean' || (value && String(value).trim() === '')) {
    return false;
  }
  return !isNaN(toNumber(value));
}

export function toNumber(value: any): number {
  const val =
    value &&
    value
      .toString()
      .replace(/\s/g, '')
      .replace(',', '.');

  return Number(val);
}

export function deepObjectsEquals(object1: any, object2: any): boolean {
  return isEqual(cleanObject(object1), cleanObject(object2));
}

export function cleanObject(object: any): any {
  return omitBy(object, isNil);
}

export function deepObjectCopy<T>(object: T): T {
  return cloneDeep(object);
}

export function isArray<T>(input?: any): input is T[] {
  return Array.isArray(input);
}

export function isDateValid(date: Date): boolean {
  return date && date.getTime && !isNaN(date.getTime());
}
