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

import {AttributesResourceType} from '../../model/resource';
import {DataAggregationType} from '../../../shared/utils/data/data-aggregation';
import {Constraint} from '../../model/data/constraint';
import {QueryStem} from '../navigation/query/query';

export const DEFAULT_PIVOT_ID = 'default';

export interface Pivot {
  id: string;
  config?: PivotConfig;
}

export interface PivotConfig {
  version?: PivotConfigVersion;
  stemsConfigs: PivotStemConfig[];
  mergeTables?: boolean;
}

export interface PivotStemConfig {
  stem?: QueryStem;
  rowAttributes: PivotRowAttribute[];
  columnAttributes: PivotColumnAttribute[];
  valueAttributes: PivotValueAttribute[];
}

export enum PivotConfigVersion {
  V1 = '1',
}

export interface PivotAttribute {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
  constraint?: Constraint;
}

export interface PivotRowColumnAttribute extends PivotAttribute {
  showSums?: boolean;
  sort?: PivotSort;
}

export interface PivotRowAttribute extends PivotRowColumnAttribute {}

export interface PivotColumnAttribute extends PivotRowColumnAttribute {}

export interface PivotSortValue {
  title: string;
  isSummary?: boolean;
}

export interface PivotSortList {
  valueTitle: string;
  values: PivotSortValue[];
}

export interface PivotSort {
  attribute?: PivotAttribute;
  list?: PivotSortList;
  asc: boolean;
}

export enum PivotValueType {
  Default = 'default',
  ColumnPercentage = 'column',
  RowPercentage = 'row',
  AllPercentage = 'all',
}

export interface PivotValueAttribute extends PivotAttribute {
  aggregation: DataAggregationType;
  valueType?: PivotValueType;
}
