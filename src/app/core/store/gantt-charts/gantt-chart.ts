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

export const DEFAULT_GANTT_CHART_ID = 'default';
export const GANTT_DATE_FORMAT = 'YYYY-MM-DD';

export interface GanttChart {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  collections: Record<string, GanttChartCollectionConfig>;
}

export interface GanttChartCollectionConfig {
  barsProperties: Record<string, GanttChartBarModel>;
}

export interface GanttChartBarModel {
  collectionId: string;
  attributeId: string;
}

export interface GanttChartTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string;
  start_drag: boolean;
  end_drag: boolean;
  editable: boolean;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  swimlane?: string;
  sub_swimlane?: string;

  // custom attributes
  startAttributeId: string;
  endAttributeId: string;
  progressAttributeId: string;
  collectionId?: string;
}

export enum GanttChartMode {
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
  Category = 'category',
  SubCategory = 'subCategory',
}
