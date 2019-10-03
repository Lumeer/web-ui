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

import {ConstraintConfig} from '../../../../../core/model/data/constraint-config';
import {ChartAxisType, ChartType} from '../../../../../core/store/charts/chart';
import {createDateTimeOptions, hasTimeOption} from '../../../../../shared/date-time/date-time-options';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {
  dateReadableFormatsMap,
  DateReadableFormatType,
} from '../../../../../shared/select/select-constraint-item/constraint/date-time';

export interface ChartData {
  sets: ChartDataSet[];
  type: ChartType;
  constraintData?: ConstraintData;
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
  Duration = 'duration',
  Number = 'number',
  Text = 'text',
}

export type ChartYAxisType = ChartAxisType.Y1 | ChartAxisType.Y2;

export function convertChartDateFormat(format: string): string {
  if (!format) {
    return 'YYYY-MM-DD';
  }

  const knowFormatEntry = checkKnownOverrideFormatEntry(format);
  if (knowFormatEntry) {
    return knowFormatEntry[1];
  }

  const options = createDateTimeOptions(format);
  let chartFormat = '';

  if (options.year) {
    chartFormat += 'YYYY';
    if (options.month || options.day) {
      chartFormat += '-';
    }
  }

  if (options.month) {
    chartFormat += 'MM';
    if (options.day) {
      chartFormat += '-';
    }
  }

  if (options.day) {
    chartFormat += 'DD';
  }

  if (hasTimeOption(options)) {
    chartFormat += ' ';
  }

  if (options.hours) {
    chartFormat += 'HH';
    if (options.minutes || options.seconds) {
      chartFormat += ':';
    }
  }

  if (options.minutes) {
    chartFormat += 'mm';
    if (options.seconds) {
      chartFormat += ':';
    }
  }

  if (options.seconds) {
    chartFormat += 'ss';
  }

  return chartFormat;
}

export function checkKnownOverrideFormatEntry(format: string): [string, string] {
  return Object.entries(dateReadableFormatsMap).find(([type, knownFormat]) => {
    if (knownFormat === format) {
      const notSafeTypes = [
        DateReadableFormatType.MonthYear,
        DateReadableFormatType.DayMonth,
        DateReadableFormatType.DayMonthYear,
      ];
      return !notSafeTypes.map(t => t.toString()).includes(type);
    }
    return false;
  });
}
