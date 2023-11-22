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
import {RoleType} from '../../model/role-type';
import {CalendarConfig} from '../calendars/calendar';
import {ChartConfig} from '../charts/chart';
import {DetailConfig} from '../details/detail';
import {FormConfig} from '../form/form-model';
import {GanttChartConfig} from '../gantt-charts/gantt-chart';
import {KanbanConfig} from '../kanbans/kanban';
import {MapConfig} from '../maps/map.model';
import {Query} from '../navigation/query/query';
import {PivotConfig} from '../pivots/pivot';
import {SearchConfig} from '../searches/search';
import {TableConfig} from '../tables/table.model';
import {ViewSettings} from '../view-settings/view-settings';
import {WorkflowConfig} from '../workflows/workflow';

export interface View extends Resource {
  perspective?: Perspective;
  query?: Query;
  config?: ViewConfig;
  additionalQueries?: Query[];
  settings?: ViewSettings;
  authorCollectionsRoles?: Record<string, RoleType[]>;
  authorLinkTypesRoles?: Record<string, RoleType[]>;
  lastTimeUsed?: Date;
  favorite?: boolean;
  folders?: string[];
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
  form?: FormConfig;
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
  | PivotConfig
  | FormConfig;

export interface ViewGlobalConfig {
  sidebarOpened?: boolean;
  panelWidth?: number;
}

export interface DefaultViewConfig {
  key: string;
  perspective: Perspective;
  config: ViewConfig;
  updatedAt?: Date;
}

export const viewRoleTypes = [
  RoleType.Read,
  RoleType.DataRead,
  RoleType.DataWrite,
  RoleType.DataContribute,
  RoleType.DataDelete,
  RoleType.QueryConfig,
  RoleType.Manage,
  RoleType.CommentContribute,
  RoleType.TechConfig,
  RoleType.UserConfig,
  RoleType.PerspectiveConfig,
];
