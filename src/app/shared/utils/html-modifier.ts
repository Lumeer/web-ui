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

import {DataValue} from '@lumeer/data-filters';
import * as pressure from 'pressure';

export class HtmlModifier {
  public static removeHtmlComments(html: HTMLElement): string {
    return html && html.innerHTML && html.innerHTML.replace(/<!--[\s\S]*?-->/g, '').trim();
  }

  public static setCursorAtTextContentEnd(element: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function setCursorAtDataInputEnd(element: HTMLInputElement, dataValue: DataValue) {
  const value = dataValue.editValue() || '';
  element.setSelectionRange(value.length, value.length);
  element.focus();
}

export function checkDataInputElementValue(element: HTMLInputElement, dataValue: DataValue) {
  if (element && dataValue) {
    const value = dataValue.format();
    if (element.value !== value) {
      element.value = value;
    }
  }
}

export function shadeColor(color: string, percent: number): string {
  if (color) {
    const f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff;
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1)
    );
  }
  return '';
}

export function getCaretCharacterOffsetWithin(element) {
  let caretOffset = 0;
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  let sel;
  if (typeof win.getSelection !== 'undefined') {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
  } else if ((sel = doc.selection) && sel.type !== 'Control') {
    const textRange = sel.createRange();
    const preCaretTextRange = doc.body.createTextRange();
    preCaretTextRange.moveToElementText(element);
    preCaretTextRange.setEndPoint('EndToEnd', textRange);
    caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
}

export function stripedBackground(color: string, stripeColor: string): string {
  return `linear-gradient(-45deg, ${color} 25%, ${stripeColor} 25%, ${stripeColor} 50%, ${color} 50%, ${color} 75%, ${stripeColor} 75%, ${stripeColor})`;
}

export function hex2rgba(hex: string, opacity: number): string {
  hex = (hex || '').replace('#', '');
  const r = parseInt(hex.substring(0, hex.length / 3), 16);
  const g = parseInt(hex.substring(hex.length / 3, (2 * hex.length) / 3), 16);
  const b = parseInt(hex.substring((2 * hex.length) / 3, (3 * hex.length) / 3), 16);

  return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
}

export function clickedInsideElement(event: Event, tagName: string): boolean {
  const paths = (<any>event).path as HTMLElement[];
  if (paths) {
    for (const element of paths) {
      if (element?.tagName?.toUpperCase() === tagName.toUpperCase()) {
        return true;
      }
    }
  }
  return false;
}

export function initForceTouch(element: HTMLElement, callback: (event: MouseEvent) => void) {
  let fullyTouched = false;
  let touchEvent = null;
  pressure.set(
    element,
    {
      change: (force, event) => {
        fullyTouched = force >= 1;
        touchEvent = event;
      },
      start: () => {
        fullyTouched = false;
        touchEvent = null;
      },
      end: () => {
        if (fullyTouched && touchEvent) {
          callback(touchEvent);
        }
      },
    },
    {only: 'touch', preventSelect: false}
  );
}

export function isElementActive(element: Element): boolean {
  return element && document.activeElement === element;
}
