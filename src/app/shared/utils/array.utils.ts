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

export function copyAndSpliceArray<T>(array: T[], index: number, deleteCount: number, ...items: T[]): T[] {
  const arrayCopy = [...array];
  arrayCopy.splice(index, deleteCount, ...items);
  return arrayCopy;
}

export function deepArrayEquals(array1: any[], array2: any[]): boolean {
  return JSON.stringify(array1) === JSON.stringify(array2);
}

export function arrayStartsWith(longer: any[], shorter: any[]): boolean {
  return longer && shorter && longer.join().startsWith(shorter.join());
}

export function getLastFromArray<T>(array: T[]): T {
  return array[array.length - 1];
}

export function isArraySubset(superset: any[], subset: any[]): boolean {
  return subset.every(item => superset.includes(item));
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
  return a.filter(x => b.includes(x));
}

export function shiftArray<T>(array: T[], fromItem: T): T[] {
  const index = array.findIndex(item => item === fromItem);
  if (index === -1) {
    return [...array];
  }
  return [...array.slice(index), ...array.slice(0, index)];
}
