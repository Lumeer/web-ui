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

import {isNullOrUndefined, toNumber} from '../../../../../shared/utils/common.utils';

export function createRange(values: number[]): [number, number] {
  let min = null;
  let max = null;

  values.forEach(value => {
    const numberValue = toNumber(value);
    if (isNullOrUndefined(min) || min > numberValue) {
      min = numberValue;
    }
    if (isNullOrUndefined(max) || max < numberValue) {
      max = numberValue;
    }
  });

  if (isNullOrUndefined(min) || isNullOrUndefined(max)) {
    return null;
  }

  const range = Math.abs(max - min);
  const step = Math.log10(range) * 10;

  const bottomRange = min < 0 ? Math.min(min * 1.1, min - step) : Math.min(min * 0.9, min - step);
  const upperRange = max < 0 ? Math.max(max * 0.9, max + step) : Math.max(max * 1.1, max + step);

  return [bottomRange, upperRange];
}
