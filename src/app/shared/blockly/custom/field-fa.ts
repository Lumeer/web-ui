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
import * as Blockly from 'blockly';

const glyphCache = new Map<string, string>();

/**
 * Reads the Font Awesome glyph of the given icon classes (e.g. 'fas fa-abacus') from the loaded stylesheet,
 * so that there is no icon table to maintain.
 */
function iconGlyph(icon: string): string {
  if (!icon) {
    return '';
  }
  if (glyphCache.has(icon)) {
    return glyphCache.get(icon);
  }

  const element = document.createElement('i');
  element.className = icon;
  element.style.position = 'absolute';
  element.style.visibility = 'hidden';
  document.body.appendChild(element);
  const content = window.getComputedStyle(element, '::before').content || '';
  document.body.removeChild(element);

  const glyph = /^["'].*["']$/.test(content) ? content.slice(1, -1) : '';
  if (glyph) {
    // an empty result may only mean that the stylesheet is not loaded yet
    glyphCache.set(icon, glyph);
  }
  return glyph;
}

/**
 * Non-editable field showing a Font Awesome icon in the given color.
 * Used in block definitions as {type: 'field_fa', icon: 'fas fa-abacus', iconColor: '#ff0000'}.
 */
export class FieldFA extends Blockly.FieldLabel {
  private readonly iconStyle: string;

  constructor(
    icon: string,
    private readonly iconColor?: string
  ) {
    super(iconGlyph(icon));
    this.iconStyle = (icon || '').split(' ')[0];
  }

  public static fromJson(options: any): FieldFA {
    return new FieldFA(options['icon'], options['iconColor']);
  }

  public initView() {
    super.initView();
    const element = this.getTextElement();
    element.classList.add('blocklyFontAwesome');
    if (this.iconStyle) {
      element.classList.add(this.iconStyle);
    }
    if (this.iconColor) {
      element.style.fill = this.iconColor;
    }
  }
}
