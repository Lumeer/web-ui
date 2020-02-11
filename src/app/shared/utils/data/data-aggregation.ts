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

import {Constraint} from '../../../core/model/constraint';
import {ConstraintType} from '../../../core/model/data/constraint';
import Big from 'big.js';
import {convertToBig} from '../data.utils';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../common.utils';
import {DataResource} from '../../../core/model/resource';
import {Attribute} from '../../../core/store/collections/collection';
import {uniqueValues} from '../array.utils';

export enum DataAggregationType {
  Sum = 'sum',
  Min = 'min',
  Max = 'max',
  Avg = 'avg',
  Count = 'count',
  Unique = 'unique',
}

export function isValueAggregation(aggregation: DataAggregationType): boolean {
  return !aggregation || ![DataAggregationType.Count, DataAggregationType.Unique].includes(aggregation);
}

export function aggregateDataResources(
  aggregation: DataAggregationType,
  dataResources: DataResource[],
  attribute: Attribute,
  onlyNumeric?: boolean
): any {
  if (!attribute) {
    return null;
  }

  const values = (dataResources || []).map(resource => resource.data[attribute.id]);
  return aggregateDataValues(aggregation, values, attribute.constraint, onlyNumeric);
}

export function aggregateDataValues(
  aggregation: DataAggregationType,
  values: any[],
  constraint?: Constraint,
  onlyNumeric?: boolean
): any {
  const nonNullValues = (values || []).filter(value => isNotNullOrUndefined(value));
  switch (aggregation) {
    case DataAggregationType.Sum:
      return sumValues(nonNullValues, constraint, onlyNumeric);
    case DataAggregationType.Avg:
      return avgValues(nonNullValues, constraint, onlyNumeric);
    case DataAggregationType.Min:
      return minInValues(nonNullValues, constraint, onlyNumeric);
    case DataAggregationType.Max:
      return maxInValues(nonNullValues, constraint, onlyNumeric);
    case DataAggregationType.Count:
      return countValues(nonNullValues);
    case DataAggregationType.Unique:
      return uniqueValuesCount(nonNullValues);
    default:
      return sumAnyValues(nonNullValues, onlyNumeric);
  }
}

function sumValues(values: any[], constraint: Constraint, onlyNumeric): any {
  if (!constraint) {
    return sumAnyValues(values, onlyNumeric);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Duration:
      return sumNumericValues(values, onlyNumeric);
    default:
      if (formattedValuesAreNumeric(values, constraint)) {
        return sumNumericValues(formattedValues(values, constraint), onlyNumeric);
      }
      return sumAnyValues(values, onlyNumeric);
  }
}

function formattedValuesAreNumeric(values: any[], constraint: Constraint): boolean {
  return formattedValues(values, constraint).every(value => isNumeric(value));
}

function formattedValues(values: any[], constraint: Constraint): any[] {
  return values.map(value => constraint.createDataValue(value).format());
}

function sumNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return bigValues.reduce((sum, val) => sum.add(val), new Big(0)).toFixed();
}

function transformToBigValues(values: any[]): Big[] {
  return values.map(value => convertToBig(value)).filter(value => !!value);
}

function sumAnyValues(values: any[], onlyNumeric): any {
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

function avgValues(values: any[], constraint: Constraint, onlyNumeric): any {
  if (!constraint) {
    return avgAnyValues(values, onlyNumeric);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Duration:
      return avgNumericValues(values, onlyNumeric);
    default:
      if (formattedValuesAreNumeric(values, constraint)) {
        return avgNumericValues(formattedValues(values, constraint), onlyNumeric);
      }
      return avgAnyValues(values, onlyNumeric);
  }
}

function avgNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return bigValues
    .reduce((sum, val) => sum.add(val), new Big(0))
    .div(values.length)
    .toFixed();
}

function avgAnyValues(values: any[], onlyNumeric): any {
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

function minInValues(values: any[], constraint: Constraint, onlyNumeric: boolean): any {
  if (!constraint) {
    return minInAnyValues(values, onlyNumeric);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Duration:
      return minInNumericValues(values, onlyNumeric);
    default:
      if (formattedValuesAreNumeric(values, constraint)) {
        return minInNumericValues(formattedValues(values, constraint), onlyNumeric);
      }
      return minInAnyValues(values, onlyNumeric);
  }
}

function minInNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return bigValues.reduce((minValue, value) => (value.cmp(minValue) < 0 ? value : minValue), bigValues[0]).toFixed();
}

function minInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  return filteredValues.reduce((minValue, value) => (value < minValue ? value : minValue), filteredValues[0]);
}

function maxInValues(values: any[], constraint: Constraint, onlyNumeric: boolean): any {
  if (!constraint) {
    return maxInAnyValues(values, onlyNumeric);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Duration:
      return maxInNumericValues(values, onlyNumeric);
    default:
      if (formattedValuesAreNumeric(values, constraint)) {
        return maxInNumericValues(formattedValues(values, constraint), onlyNumeric);
      }
      return maxInAnyValues(values, onlyNumeric);
  }
}

function maxInNumericValues(values: any[], onlyNumeric: boolean): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return onlyNumeric ? null : values[0];
  }

  return bigValues.reduce((minValue, value) => (value.cmp(minValue) > 0 ? value : minValue), bigValues[0]).toFixed();
}

function maxInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  return filteredValues.reduce((maxValue, value) => (value > maxValue ? value : maxValue), filteredValues[0]);
}

function countValues(values: any[], onlyNumeric?: boolean) {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)) : values;
  return filteredValues.length;
}

function uniqueValuesCount(values: any[], onlyNumeric?: boolean) {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)) : values;
  return uniqueValues(filteredValues).length;
}
