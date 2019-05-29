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

import {Constraint, ConstraintType} from '../../../core/model/data/constraint';
import Big from 'big.js';
import {convertToBig} from '../data.utils';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../common.utils';
import {DataResource} from '../../../core/model/resource';
import {Attribute} from '../../../core/store/collections/collection';

export enum DataAggregationType {
  Sum = 'sum',
  Min = 'min',
  Max = 'max',
  Avg = 'avg',
  Count = 'count',
}

export function isValueAggregation(aggregation: DataAggregationType): boolean {
  return !aggregation || ![DataAggregationType.Count].includes(aggregation);
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

  const values = (dataResources || [])
    .map(resource => resource.data[attribute.id])
    .filter(value => isNotNullOrUndefined(value));
  return aggregateDataValues(aggregation, values, attribute.constraint, onlyNumeric);
}

export function aggregateDataValues(
  aggregation: DataAggregationType,
  values: any[],
  constraint: Constraint,
  onlyNumeric?: boolean
): any {
  switch (aggregation) {
    case DataAggregationType.Sum:
      return sumValues(values, constraint);
    case DataAggregationType.Avg:
      return avgValues(values, constraint);
    case DataAggregationType.Min:
      return minInValues(values, constraint, onlyNumeric);
    case DataAggregationType.Max:
      return maxInValues(values, constraint, onlyNumeric);
    case DataAggregationType.Count:
      return countValues(values, onlyNumeric);
    default:
      return sumAnyValues(values);
  }
}

function sumValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return sumAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return sumNumericValues(values);
    default:
      return sumAnyValues(values);
  }
}

function sumNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.reduce((sum, val) => sum.add(val), new Big(0)).toFixed();
}

function transformToBigValues(values: any[]): Big[] {
  return values.map(value => convertToBig(value)).filter(value => !!value);
}

function sumAnyValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return values[0];
  }

  return numericValues.reduce((sum, value) => sum + toNumber(value), 0);
}

function avgValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return avgAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return avgNumericValues(values);
    default:
      return avgAnyValues(values);
  }
}

function avgNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues
    .reduce((sum, val) => sum.add(val), new Big(0))
    .div(values.length)
    .toFixed();
}

function avgAnyValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return values[0];
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
      return minInNumericValues(values);
    default:
      return minInAnyValues(values, onlyNumeric);
  }
}

function minInNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.sort((a, b) => a.cmp(b))[0].toFixed();
}

function minInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  const sortedValues = filteredValues.sort((a, b) => (a > b ? 1 : -1));
  return sortedValues[0];
}

function maxInValues(values: any[], constraint: Constraint, onlyNumeric: boolean): any {
  if (!constraint) {
    return maxInAnyValues(values, onlyNumeric);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return maxInNumericValues(values);
    default:
      return maxInAnyValues(values, onlyNumeric);
  }
}

function maxInNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.sort((a, b) => -1 * a.cmp(b))[0].toFixed();
}

function maxInAnyValues(values: any[], onlyNumeric: boolean): any {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  const sortedValues = filteredValues.sort((a, b) => (a > b ? -1 : 1));
  return sortedValues[0];
}

function countValues(values: any[], onlyNumeric: boolean) {
  const filteredValues = onlyNumeric ? values.filter(value => isNumeric(value)).map(value => toNumber(value)) : values;
  return filteredValues.length;
}
