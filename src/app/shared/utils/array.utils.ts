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

import {deepObjectsEquals, isNotNullOrUndefined} from './common.utils';

export function copyAndSpliceArray<T>(array: T[], index: number, deleteCount: number, ...items: T[]): T[] {
  const arrayCopy = [...array];
  arrayCopy.splice(index, deleteCount, ...items);
  return arrayCopy;
}

export function deepArrayEquals(array1: any[], array2: any[]): boolean {
  return deepObjectsEquals(array1, array2);
}

export function arrayStartsWith(longer: any[], shorter: any[]): boolean {
  return longer && shorter && longer.join().startsWith(shorter.join());
}

export function getLastFromArray<T>(array: T[]): T {
  return array && array[array.length - 1];
}

export function isArraySubset(superset: any[], subset: any[]): boolean {
  if (subset.length === 0 && superset.length !== 0) {
    return false;
  }
  return subset.every(item => superset.includes(item));
}

export function areArraysSame(array1: any[], array2: any[]): boolean {
  const a1 = array1 || [];
  const a2 = array2 || [];
  return a1.length === a2.length && a1.every((value, index) => deepObjectsEquals(value, a2[index]));
}

export function getArrayDifference<T>(bigArray: T[], smallArray: T[]): T[] {
  if (bigArray.length < smallArray.length) {
    return getArrayDifference(smallArray, bigArray);
  }

  return bigArray.filter(item => !smallArray.includes(item));
}

export function containsSameElements(array1: any[], array2: any[]): boolean {
  return array1.length === array2.length && arrayIntersection(array1, array2).length === array1.length;
}

export function arrayIntersection<T>(array1: T[], array2: T[]): T[] {
  const a = array1 || [];
  const b = array2 || [];
  return a.filter(x => b.some(y => deepObjectsEquals(x, y)));
}

export function shiftArray<T>(array: T[], fromItem: T): T[] {
  const index = array.findIndex(item => item === fromItem);
  return shiftArrayFromIndex<T>(array, index);
}

export function shiftArrayFromIndex<T>(array: T[], fromIndex: number): T[] {
  if (fromIndex < 0) {
    return [...array];
  }
  return [...array.slice(fromIndex), ...array.slice(0, fromIndex)];
}

export function uniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function flattenMatrix<T>(array: T[][]): T[] {
  return (array || []).reduce((arr, item) => {
    arr.push(...item);
    return arr;
  }, []);
}

export function createRangeInclusive(from: number, to: number): number[] {
  const range = [];
  if (to > from) {
    for (let i = from; i <= to; i++) {
      range.push(i);
    }
  } else {
    for (let i = from; i >= to; i--) {
      range.push(i);
    }
  }
  return range;
}

export function appendToArray<T>(array: T[], item: T): T[] {
  return [...(array || []), item];
}

export function removeFromArray<T>(array: T[], item: T): T[] {
  return [...(array || [])].filter(it => it !== item);
}

export function createRange(from: number, to: number): number[] {
  const range = [...Array(to - from).keys()];
  return range.map(r => r + from);
}

export function fillWithNulls<T>(array: T[], maximum: number): T[] {
  const copy = [...(array || [])];
  for (let i = array.length; i < maximum; i++) {
    copy.push(null);
  }
  return copy;
}

export function filterNotNull<T>(values: T[]): T[] {
  return [...(values || [])].filter(value => isNotNullOrUndefined(value));
}

export function reversedArray<T>(array: T[]): T[] {
  const copy = [...(array || [])];
  copy.reverse();
  return copy;
}

export function moveItemsInArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const arrayCopy = [...array];
  const element = arrayCopy[fromIndex];
  arrayCopy.splice(fromIndex, 1);
  arrayCopy.splice(toIndex, 0, element);
  return arrayCopy;
}
