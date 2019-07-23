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
import {Constraint} from '../../model/data/constraint';
import {QueryStem} from '../navigation/query';

export const DEFAULT_GANTT_CHART_ID = 'default';
export const GANTT_DATE_FORMAT = 'YYYY-MM-DD HH:MM';

export interface GanttChart {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  stemsConfigs: GanttChartStemConfig[];
  version?: GanttChartConfigVersion;
}

export enum GanttChartConfigVersion {
  V1 = '1',
}

export interface GanttChartStemConfig {
  stem?: QueryStem;
  barsProperties: Record<string, GanttChartBarModel>;
}

export interface GanttChartBarModel {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
  constraint?: Constraint;
}

export interface GanttChartTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  allowed_dependencies: string;
  start_drag: boolean;
  end_drag: boolean;
  editable: boolean;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  swimlane?: string;
  sub_swimlane?: string;

  metadata: GanttChartTaskMetadata;
}

export interface GanttChartTaskMetadata {
  dataResourceId: string;
  startAttributeId: string;
  endAttributeId: string;
  progressAttributeId: string;
  resourceId?: string;
  resourceType: AttributesResourceType;
}

export enum GanttChartMode {
  QuarterDay = 'Quarter Day',
  HalfDay = 'Half Day',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}

export type GanttChartBarProperty = GanttChartBarPropertyRequired | GanttChartBarPropertyOptional;

export enum GanttChartBarPropertyRequired {
  Name = 'name',
  Start = 'start',
  End = 'end',
}

export enum GanttChartBarPropertyOptional {
  Progress = 'progress',
  Color = 'color',
  Category = 'category',
  SubCategory = 'subCategory',
}
