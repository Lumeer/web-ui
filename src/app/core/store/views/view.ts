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

import {SizeType} from '../../../shared/slider/size-type';
import {Perspective} from '../../../view/perspectives/perspective';
import {Resource} from '../../model/resource';
import {CalendarConfig} from '../calendars/calendar';
import {ChartConfig} from '../charts/chart';
import {GanttChartConfig} from '../gantt-charts/gantt-chart';
import {Query} from '../navigation/query/query';
import {TableConfig} from '../tables/table.model';
import {KanbanConfig} from '../kanbans/kanban';
import {PivotConfig} from '../pivots/pivot';

export interface View extends Resource {
  perspective: Perspective;
  query: Query;
  config: ViewConfig;
  authorRights?: {[collectionId: string]: string[]};
  lastTimeUsed?: Date;
  favorite?: boolean;
}

export interface ViewConfig {
  detail?: DetailConfig;
  postit?: PostItConfig;
  search?: SearchConfig;
  table?: TableConfig;
  ganttChart?: GanttChartConfig;
  calendar?: CalendarConfig;
  chart?: ChartConfig;
  kanban?: KanbanConfig;
  pivot?: PivotConfig;
}

export interface DetailConfig {
  whateverConfig?: string;
}

export interface PostItConfig {
  size?: SizeType;
  documentIdsOrder?: string[];
}

export interface SearchConfig {
  expandedDocumentIds?: string[];
  searchTab?: string; // TODO maybe create enum
}

export type PerspectiveConfig =
  | DetailConfig
  | PostItConfig
  | SearchConfig
  | TableConfig
  | GanttChartConfig
  | CalendarConfig
  | ChartConfig
  | KanbanConfig
  | PivotConfig;

export interface ViewGlobalConfig {
  sidebarOpened?: boolean;
}
