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
import {convertStringToNumberSafely} from '../string/convert-string-to-number-safely';
import {removeTrailingZeroes} from '../string/remove-trailing-zeroes';

export function convertBigToNumberSafely(big: Big, decimals = 0): number | string {
  const value = big && removeTrailingZeroes(big.toFixed(decimals > 0 ? decimals : 0));
  return value && !value.includes('.') ? convertStringToNumberSafely(value) : value;
}
