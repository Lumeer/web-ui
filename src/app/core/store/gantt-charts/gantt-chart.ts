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

import {Constraint} from '../../model/constraint';
import {AttributesResourceType} from '../../model/resource';
import {QueryStem} from '../navigation/query/query';
import {DataAggregationType} from '../../../shared/utils/data/data-aggregation';

export const DEFAULT_GANTT_CHART_ID = 'default';
export const GANTT_DATE_FORMAT = 'YYYY-MM-DD HH:MM';
export const GANTT_COLUMN_WIDTH = 40;
export const GANTT_PADDING = 20;

export interface GanttChart {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  stemsConfigs: GanttChartStemConfig[];
  lockResize?: boolean;
  columnWidth?: number;
  padding?: number;
  barHeight?: number;
  showDates?: boolean;
  swimlaneWidths?: number[];
  version?: GanttChartConfigVersion;
}

export enum GanttChartConfigVersion {
  V1 = '1',
  V2 = '2',
}

export interface GanttChartStemConfig {
  stem?: QueryStem;
  name?: GanttChartBarModel;
  start?: GanttChartBarModel;
  end?: GanttChartBarModel;

  progress?: GanttChartProgressBarModel;
  color?: GanttChartBarModel;
  categories?: GanttChartBarModel[];
}

export interface GanttChartBarModel {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
  constraint?: Constraint;
}

export interface GanttChartProgressBarModel extends GanttChartBarModel {
  aggregation?: DataAggregationType;
}

export enum GanttChartMode {
  QuarterDay = 'Quarter Day',
  HalfDay = 'Half Day',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}
