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

import {isArraySortedSubset} from './array.utils';

describe('isArraySortedSubset()', () => {
  it('valid subset 1', () => {
    expect(isArraySortedSubset([1, 2, 3], [2, 3])).toEqual(true);
  });
  it('valid subset 2', () => {
    expect(isArraySortedSubset([1, 2, 3], [2])).toEqual(true);
  });
  it('valid subset 3', () => {
    expect(isArraySortedSubset([1, 2, 3, 4, 5], [2, 5])).toEqual(true);
  });
  it('invalid subset 1', () => {
    expect(isArraySortedSubset([1, 2, 3], [3, 2])).toEqual(false);
  });
  it('invalid subset 2', () => {
    expect(isArraySortedSubset([1, 2, 3], [2, 3, 4])).toEqual(false);
  });
  it('invalid subset 3', () => {
    expect(isArraySortedSubset([1, 2, 3], [4, 3])).toEqual(false);
  });
});
