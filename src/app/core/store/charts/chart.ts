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

import {DataAggregationType} from '../../../shared/utils/data/data-aggregation';
import {QueryAttribute} from '../../model/query-attribute';

export const DEFAULT_CHART_ID = 'default';

export interface Chart {
  id: string;
  config?: ChartConfig;
}

export interface ChartConfig {
  type: ChartType;
  axes?: Partial<Record<ChartAxisType, ChartAxisConfig>>;
  prediction?: boolean;
  lockAxes?: boolean;
  rangeSlider?: boolean;
  sort?: ChartSort;
  version: ChartConfigVersion;
}

export enum ChartConfigVersion {
  V1 = '1',
}

export interface ChartAxisConfig {
  axis?: ChartAxis;
  name?: ChartAxis;
  color?: ChartAxis;
  size?: ChartAxis;
  aggregation?: DataAggregationType;
  settings?: ChartAxisSettings;
}

export interface ChartAxis extends QueryAttribute {}

export interface ChartAxisSettings {
  range?: [number, number];
}

export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Bubble = 'bubble',
  Pie = 'pie',
}

export const chartTypesIconsMap: Record<string, string> = {
  [ChartType.Line]: 'far fa-chart-line',
  [ChartType.Bar]: 'far fa-chart-bar',
  [ChartType.Bubble]: 'far fa-chart-scatter',
  [ChartType.Pie]: 'far fa-chart-pie',
};

export enum ChartAxisType {
  X = 'x',
  Y1 = 'y1',
  Y2 = 'y2',
}

export interface ChartSort {
  type: ChartSortType;
  axis?: ChartAxis;
}

export enum ChartSortType {
  Ascending = 'asc',
  Descending = 'desc',
}
