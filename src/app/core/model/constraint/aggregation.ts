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

import {isNumeric, toNumber} from '../../../shared/utils/common.utils';
import {Constraint} from './index';
import Big from 'big.js';
import {convertToBig} from '../../../shared/utils/data.utils';
import {uniqueValues} from '../../../shared/utils/array.utils';

export function medianInNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values).sort((a, b) => a.cmp(b));
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  } else if (bigValues.length === 1) {
    return toNumber(bigValues[0].toFixed());
  }

  const middle = Math.floor(bigValues.length / 2);
  if (bigValues.length % 2 === 0) {
    return toNumber(
      bigValues[middle]
        .plus(bigValues[middle - 1])
        .div(new Big(2))
        .toFixed()
    );
  }
  return toNumber(bigValues[middle].toFixed());
}

export function medianInAnyValues(values: any[], onlyNumeric): any {
  const nonZeroValues = values.filter(val => val !== 0 && val !== '0');
  const containsOnlyPercentValues = nonZeroValues.length > 0 && nonZeroValues.every(val => isPercentageValue(val));
  if (containsOnlyPercentValues && !onlyNumeric) {
    const percentageNumericValues = mapPercentageValues(nonZeroValues);
    return `${median(percentageNumericValues, onlyNumeric)}%`;
  }

  const numericValues = values.filter(value => isNumeric(value));
  return median(numericValues, onlyNumeric);
}

function median(values: number[], onlyNumeric?: boolean): number {
  if (values.length === 0) {
    return onlyNumeric ? null : values[0] || 0;
  } else if (values.length === 1) {
    return values[0];
  }
  const valuesSorted = values.sort((a, b) => a - b);

  const middle = Math.floor(values.length / 2);
  if (valuesSorted.length % 2 === 0) {
    return (valuesSorted[middle] + valuesSorted[middle - 1]) / 2;
  }

  return valuesSorted[middle];
}

function valuesAreNumeric(values: any[]): boolean {
  return values.every(value => isNumeric(value));
}

function formattedValues(values: any[], constraint: Constraint): any[] {
  return values.map(value => constraint.createDataValue(value).format());
}

export function sumNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return toNumber(bigValues.reduce((sum, val) => sum.add(val), new Big(0)).toFixed());
}

function transformToBigValues(values: any[]): Big[] {
  return values.map(value => convertToBig(value)).filter(value => !!value);
}

export function sumAnyValues(values: any[], onlyNumeric): any {
  const nonZeroValues = values.filter(val => val !== 0 && val !== '0');
  const containsOnlyPercentValues = nonZeroValues.length > 0 && nonZeroValues.every(val => isPercentageValue(val));
  if (containsOnlyPercentValues && !onlyNumeric) {
    const percentageNumericValues = mapPercentageValues(nonZeroValues);
    const percentSum = percentageNumericValues.reduce((sum, value) => sum + toNumber(value), 0);
    return `${percentSum}%`;
  }

  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return onlyNumeric ? null : values[0] || 0;
  }

  return numericValues.reduce((sum, value) => sum + toNumber(value), 0);
}

function isPercentageValue(value: any): boolean {
  if (!value) {
    return false;
  }

  const parts = String(value).split('%', 2);
  return parts.length === 2 && isNumeric(parts[0]) && parts[1].length === 0;
}

function mapPercentageValues(values: any[]): number[] {
  return values.map(value => toNumber(String(value).split('%', 2)[0]));
}

export function avgNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return toNumber(
    bigValues
      .reduce((sum, val) => sum.add(val), new Big(0))
      .div(values.length)
      .toFixed()
  );
}

export function avgAnyValues(values: any[], onlyNumeric): any {
  const nonZeroValues = values.filter(val => val !== 0 && val !== '0');
  const containsOnlyPercentValues = nonZeroValues.length > 0 && nonZeroValues.every(val => isPercentageValue(val));
  if (containsOnlyPercentValues && !onlyNumeric) {
    const percentageNumericValues = mapPercentageValues(nonZeroValues);
    const avg =
      percentageNumericValues.reduce((sum, value) => sum + toNumber(value), 0) / percentageNumericValues.length;
    return `${avg}%`;
  }

  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return onlyNumeric ? null : values[0] || 0;
  }

  return numericValues.reduce((sum, value) => sum + toNumber(value), 0) / numericValues.length;
}

export function minInNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return toNumber(
    bigValues.reduce((minValue, value) => (value.cmp(minValue) < 0 ? value : minValue), bigValues[0]).toFixed()
  );
}

export function minInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  return filteredValues.reduce((minValue, value) => (value < minValue ? value : minValue), filteredValues[0]);
}

export function maxInNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return toNumber(
    bigValues.reduce((minValue, value) => (value.cmp(minValue) > 0 ? value : minValue), bigValues[0]).toFixed()
  );
}

export function maxInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  return filteredValues.reduce((maxValue, value) => (value > maxValue ? value : maxValue), filteredValues[0]);
}

export function countValues(values: any[], onlyNumeric?: boolean) {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)) : values;
  return filteredValues.length;
}

export function uniqueValuesCount(values: any[], onlyNumeric?: boolean) {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)) : values;
  return uniqueValues(filteredValues).length;
}
