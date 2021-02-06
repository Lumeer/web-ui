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

import {isNotNullOrUndefined} from '../common.utils';
import {DataResource} from '../../../core/model/resource';
import {Attribute} from '../../../core/store/collections/collection';
import {Constraint, UnknownConstraint} from '@lumeer/data-filters';

export enum DataAggregationType {
  Sum = 'sum',
  Min = 'min',
  Max = 'max',
  Avg = 'avg',
  Count = 'count',
  Unique = 'unique',
  Median = 'median',
}

export const defaultDataAggregationType = Object.values(DataAggregationType)[0];

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
  const notNullConstraint = constraint || new UnknownConstraint();
  switch (aggregation) {
    case DataAggregationType.Sum:
      return notNullConstraint.sum(nonNullValues, onlyNumeric);
    case DataAggregationType.Avg:
      return notNullConstraint.avg(nonNullValues, onlyNumeric);
    case DataAggregationType.Min:
      return notNullConstraint.min(nonNullValues, onlyNumeric);
    case DataAggregationType.Max:
      return notNullConstraint.max(nonNullValues, onlyNumeric);
    case DataAggregationType.Median:
      return notNullConstraint.median(nonNullValues, onlyNumeric);
    case DataAggregationType.Count:
      return notNullConstraint.count(nonNullValues);
    case DataAggregationType.Unique:
      return notNullConstraint.unique(nonNullValues);
    default:
      return notNullConstraint.sum(nonNullValues, onlyNumeric);
  }
}
