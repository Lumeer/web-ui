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

import {COLOR_LIGHT, COLOR_PRIMARY} from '../../core/constants';
import {hex2rgba} from './html-modifier';

export function contrastColor(color: string, returnCodes?: {dark: string; light: string}, opacity?: number): string {
  if (!color) {
    return returnCodes ? returnCodes.dark : COLOR_PRIMARY;
  }

  const f = parseInt(color.indexOf('#') === 0 ? color.slice(1) : color, 16),
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;

  const luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255;

  if (luminance > 0.5) {
    return returnCodes ? returnCodes.dark : hex2rgba(COLOR_PRIMARY, opacity || 1);
  } else {
    return returnCodes ? returnCodes.light : hex2rgba(COLOR_LIGHT, opacity || 1);
  }
}
