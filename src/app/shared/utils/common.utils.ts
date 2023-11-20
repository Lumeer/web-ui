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
import {SimpleChange} from '@angular/core';
import {removeAccentFromString} from '@lumeer/utils';

enum SuggestionScore {
  StartWith = 5,
  ContainsWord = 10,
  FullMatch = 20,
}

export function sortObjectsByScore<T>(objects: T[], text: string, params: string[]): T[] {
  const textLowerCase = removeAccentFromString(text || '').trim();
  const valuesArray = (objects || []).reduce<{object: T; score: number}[]>((array, object) => {
    const value = String(getValueFromObjectParams<T>(object, params));
    const valueLowerCase = removeAccentFromString(value).trim();
    if (valueLowerCase === textLowerCase) {
      array.push({object, score: SuggestionScore.FullMatch});
    } else if (valueLowerCase.split(' ').includes(textLowerCase)) {
      array.push({object, score: SuggestionScore.ContainsWord});
    } else if (valueLowerCase.startsWith(textLowerCase)) {
      array.push({object, score: SuggestionScore.StartWith});
    } else {
      array.push({object, score: 0});
    }
    return array;
  }, []);

  return valuesArray.sort((a, b) => b.score - a.score).map(v => v.object);
}

function getValueFromObjectParams<T>(object: T, params: string[]): any {
  if (!object) {
    return '';
  }

  for (let i = 0; i < (params || []).length; i++) {
    if (!object.hasOwnProperty(params[i])) {
      continue;
    }
    const value = object[params[i]];
    if (value || value === 0) {
      return value;
    }
  }
  return '';
}

export function preventEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function objectValues<T>(object: Record<string, T>): T[] {
  // Object.values is not supported in older version of js
  return Object.keys(object || {}).map(key => object[key]);
}

export function computeElementPositionInParent(event: MouseEvent, parentTag: string): {x: number; y: number} {
  let x = event.offsetX;
  let y = event.offsetY;
  let element = event.target as HTMLElement;
  while (element && element.tagName.toLowerCase() !== parentTag) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent as HTMLElement;
  }
  return {x, y};
}

export function objectChanged(change: SimpleChange): boolean {
  return change && (!change.previousValue || change.previousValue.id !== change.currentValue?.id);
}

export function getLastUrlPart(url: string): string {
  return (url || '').split('?')[0]?.split('/')?.pop();
}

export function bitTest(num: number, bit: number): boolean {
  return (num & (1 << bit)) > 0;
}

export function bitSet(num: number, bit: number) {
  return num | (1 << bit);
}

export function bitClear(num: number, bit: number) {
  return num & ~(1 << bit);
}
