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

import {removeTrailingZeroes} from './remove-trailing-zeroes';

describe('removeTrailingZeroes()', () => {
  it('should not remove zeroes in the middle', () => {
    expect(removeTrailingZeroes('8.505')).toEqual('8.505');
  });

  it('should not remove zero in the integer part', () => {
    expect(removeTrailingZeroes('10')).toEqual('10');
  });

  it('should not remove zero', () => {
    expect(removeTrailingZeroes('0')).toEqual('0');
  });

  it('should remove all fractional part zeroes', () => {
    expect(removeTrailingZeroes('90.00')).toEqual('90');
  });

  it('should remove only trailing zeroes', () => {
    expect(removeTrailingZeroes('1.0500')).toEqual('1.05');
  });
});
