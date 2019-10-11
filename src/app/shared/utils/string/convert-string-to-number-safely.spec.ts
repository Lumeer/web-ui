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

import {convertStringToNumberSafely} from './convert-string-to-number-safely';

describe('convertStringToNumberSafely()', () => {
  it('should return undefined', () => {
    expect(convertStringToNumberSafely(undefined)).toBeUndefined();
  });

  it('should return null', () => {
    expect(convertStringToNumberSafely(null)).toBeNull();
  });

  it('should return empty string', () => {
    expect(convertStringToNumberSafely('')).toEqual('');
  });

  it('should return negative number', () => {
    expect(convertStringToNumberSafely('-42')).toEqual(-42);
  });

  it('should return zero number', () => {
    expect(convertStringToNumberSafely('0')).toEqual(0);
  });

  it('should return very large number', () => {
    const largeNumber = Math.round(Number.MAX_SAFE_INTEGER / 10);
    expect(convertStringToNumberSafely(String(largeNumber))).toEqual(largeNumber);
  });

  it('should return string for min safe integer', () => {
    expect(convertStringToNumberSafely(String(Number.MIN_SAFE_INTEGER))).toEqual(String(Number.MIN_SAFE_INTEGER));
  });

  it('should return string for max safe integer', () => {
    expect(convertStringToNumberSafely(String(Number.MAX_SAFE_INTEGER))).toEqual(String(Number.MAX_SAFE_INTEGER));
  });
});
