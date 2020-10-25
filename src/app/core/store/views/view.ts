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

import {Perspective} from '../../../view/perspectives/perspective';
import {Resource} from '../../model/resource';
import {CalendarConfig} from '../calendars/calendar';
import {ChartConfig} from '../charts/chart';
import {GanttChartConfig} from '../gantt-charts/gantt-chart';
import {Query} from '../navigation/query/query';
import {TableConfig} from '../tables/table.model';
import {KanbanConfig} from '../kanbans/kanban';
import {PivotConfig} from '../pivots/pivot';
import {SearchConfig} from '../searches/search';
import {MapConfig} from '../maps/map.model';
import {WorkflowConfig} from '../workflows/workflow';

export interface View extends Resource {
  perspective: Perspective;
  query: Query;
  config: ViewConfig;
  settings?: ViewSettings;
  authorRights?: Record<string, string[]>;
  lastTimeUsed?: Date;
  favorite?: boolean;
}

export interface ViewConfig {
  detail?: DetailConfig;
  search?: SearchConfig;
  table?: TableConfig;
  ganttChart?: GanttChartConfig;
  calendar?: CalendarConfig;
  chart?: ChartConfig;
  kanban?: KanbanConfig;
  pivot?: PivotConfig;
  map?: MapConfig;
  workflow?: WorkflowConfig;
}

export interface DetailConfig {
  whateverConfig?: string;
}

export type PerspectiveConfig =
  | DetailConfig
  | SearchConfig
  | TableConfig
  | GanttChartConfig
  | CalendarConfig
  | ChartConfig
  | KanbanConfig
  | MapConfig
  | WorkflowConfig
  | PivotConfig;

export interface ViewGlobalConfig {
  sidebarOpened?: boolean;
}

export interface DefaultViewConfig {
  key: string;
  perspective: string;
  config: ViewConfig;
  updatedAt?: Date;
}

export interface ViewSettings {
  attributes?: AttributesSettings;
}

export interface AttributesSettings {
  collections?: Record<string, ResourceAttributeSettings[]>;
  linkTypes?: Record<string, ResourceAttributeSettings[]>;
}

export interface ResourceAttributeSettings {
  attributeId: string;
  hidden?: boolean;
  sort?: AttributeSortType;
}

export enum AttributeSortType {
  Ascending = 'asc',
  Descending = 'desc',
}
