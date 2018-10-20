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

export function hex2rgba(hex: string, opacity: number) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, hex.length / 3), 16);
  const g = parseInt(hex.substring(hex.length / 3, 2 * hex.length / 3), 16);
  const b = parseInt(hex.substring(2 * hex.length / 3, 3 * hex.length / 3), 16);

  return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
}
