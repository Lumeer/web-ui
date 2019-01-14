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

export interface GanttChart {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  barsProperties: {[type: string]: GanttChartBarModel};
}

export interface GanttChartBarModel {
  collectionId: string;
  attributeId: string;
}

export enum GanttChartMode {
  Day = 'Day',
  QuarterDay = 'Quarter Day',
  HalfDay = 'Half Day',
  Week = 'Week',
  Month = 'Month',
}

export enum GanttChartBarPropertyRequired {
  NAME = 'name',
  START = 'start',
  END = 'end',
}

export enum GanttChartBarPropertyOptional {
  ID = 'id',
  DEPENDENCIES = 'dependencies',
  PROGRESS = 'progress',
}
