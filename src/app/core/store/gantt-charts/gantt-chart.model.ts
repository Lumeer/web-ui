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

export interface GanttChartModel {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  bars: { [type: string]: GanttChartBarModel };
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
  Month = 'Month'
}

// export const chartTypesMap: { [id: string]: GanttChartMode } = {
//   [GanttChartMode.Line]: GanttChartMode.Line,
//   [GanttChartMode.Bar]: GanttChartMode.Bar,
//   [GanttChartMode.Pie]: GanttChartMode.Pie
// };

// export const chartTypesIconsMap: { [id: string]: string } = {
//   [GanttChartMode.Line]: 'far fa-chart-line',
//   [GanttChartMode.Bar]: 'far fa-chart-bar',
//   [GanttChartMode.Pie]: 'far fa-chart-pie'
// };

export enum GanttChartBarType {
  NAME = 'name',
  START = 'start',
  END = 'end'
}
