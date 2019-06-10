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

import {ChartAxisType, ChartType} from '../../../../../core/store/charts/chart';
import {createDateTimeOptions, hasTimeOption} from '../../../../../shared/date-time/date-time-options';
import {ConstraintConfig} from '../../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../../core/model/resource';

export interface ChartData {
  sets: ChartDataSet[];
  type: ChartType;
}

export interface ChartDataSet {
  id: string;
  points: ChartPoint[];
  color: string;
  yAxisType: ChartYAxisType;
  name: string;
  draggable: boolean;
  resourceType: AttributesResourceType;
  xAxis?: ChartDataSetAxis;
  yAxis?: ChartDataSetAxis;
}

export interface ChartDataSetAxis {
  category: ChartAxisCategory;
  config?: ConstraintConfig;
}

export interface ChartPoint {
  id?: string;
  x?: any;
  y?: any;
  isPrediction?: boolean;
}

export enum ChartAxisCategory {
  Date = 'date',
  Percentage = 'percentage',
  Number = 'number',
  Text = 'text',
}

export type ChartYAxisType = ChartAxisType.Y1 | ChartAxisType.Y2;

export function convertChartDateFormat(format: string): string {
  if (!format) {
    return 'YYYY-MM-DD';
  }
  const options = createDateTimeOptions(format);
  let chartFormat = 'YYYY-MM';

  if (options.day || hasTimeOption(options)) {
    chartFormat = `${chartFormat}-DD`;
  }

  if (hasTimeOption(options)) {
    chartFormat = `${chartFormat} HH`;
  }

  if (options.minutes || options.seconds) {
    chartFormat = `${chartFormat}:mm`;
  }

  if (options.seconds) {
    chartFormat = `${chartFormat}:ss`;
  }

  return chartFormat;
}
