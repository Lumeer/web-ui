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

import {padStart} from '../string.utils';

export function convertHslColorToHex(hsl: string): string {
  if (!hsl) {
    return '';
  }

  let [hue, saturation, lightness] = hsl
    .trim()
    .slice(4, -1)
    .split(',')
    .map(value => value.trim())
    .map(value => (value.endsWith('%') ? value.slice(0, -1) : value))
    .map(value => Number(value));

  hue /= 360;
  saturation /= 100;
  lightness /= 100;

  let red, green, blue;
  if (saturation === 0) {
    red = green = blue = lightness; // achromatic
  } else {
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    red = hueToRgb(p, q, hue + 1 / 3);
    green = hueToRgb(p, q, hue);
    blue = hueToRgb(p, q, hue - 1 / 3);
  }
  return `#${colorToHex(red)}${colorToHex(green)}${colorToHex(blue)}`;
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function colorToHex(x: number) {
  return padStart(Math.round(x * 255).toString(16), 2, '0');
}
