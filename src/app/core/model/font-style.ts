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

export enum FontStyle {
  Italic = 'italic',
  Bold = 'bold',
  Underline = 'underline',
  StrikeThrough = 'strikeThrough',
}

export function fontStylesClass(styles: FontStyle[]): string {
  let stylesCopy = [...(styles || [])];
  const classes = [];
  if (stylesCopy.includes(FontStyle.Underline) && stylesCopy.includes(FontStyle.StrikeThrough)) {
    classes.push('text-underline-line-through');
    stylesCopy = stylesCopy.filter(style => style !== FontStyle.Underline && style !== FontStyle.StrikeThrough);
  }

  classes.push(...stylesCopy.map(style => fontStyleClass(style)).filter(c => !!c));
  return classes.join(' ');
}

function fontStyleClass(style: FontStyle): string {
  switch (style) {
    case FontStyle.Bold:
      return 'fw-black';
    case FontStyle.Italic:
      return 'fst-italic';
    case FontStyle.Underline:
      return 'text-underline';
    case FontStyle.StrikeThrough:
      return 'text-line-through';
    default:
      return '';
  }
}
