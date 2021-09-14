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

export interface PerspectiveConfiguration {
  pivot?: PivotPerspectiveConfiguration;
  kanban?: KanbanPerspectiveConfiguration;
  chart?: ChartPerspectiveConfiguration;
  gantt?: GanttPerspectiveConfiguration;
  calendar?: CalendarPerspectiveConfiguration;
  map?: MapPerspectiveConfiguration;
  workflow?: WorkflowPerspectiveConfiguration;
}

interface PerspectiveWithSidebarConfiguration {
  showSidebar?: boolean;
  additionalSpace?: boolean;
}

export const defaultPerspectiveWithSidebarConfiguration: PivotPerspectiveConfiguration = {
  showSidebar: true,
  additionalSpace: true,
};

export interface PivotPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultPivotPerspectiveConfiguration: PivotPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface KanbanPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultKanbanPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface ChartPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultChartPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface GanttPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultGanttPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface CalendarPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultCalendarPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface MapPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultMapPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface WorkflowPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultWorkflowPerspectiveConfiguration: KanbanPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};
