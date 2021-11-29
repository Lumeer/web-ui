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
  detail?: DetailPerspectiveConfiguration;
  search?: SearchPerspectiveConfiguration;
  table?: TablePerspectiveConfiguration;
  form?: FormPerspectiveConfiguration;
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

export const defaultChartPerspectiveConfiguration: ChartPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface GanttPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultGanttPerspectiveConfiguration: GanttPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface CalendarPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultCalendarPerspectiveConfiguration: CalendarPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface MapPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {}

export const defaultMapPerspectiveConfiguration: MapPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
};

export interface WorkflowPerspectiveConfiguration extends PerspectiveWithSidebarConfiguration {
  scrollToSelection?: boolean;
  editableFilters?: boolean;
  showHiddenColumns?: boolean;
}

export const defaultWorkflowPerspectiveConfiguration: WorkflowPerspectiveConfiguration = {
  ...defaultPerspectiveWithSidebarConfiguration,
  scrollToSelection: true,
  editableFilters: true,
  showHiddenColumns: true,
};

export interface DetailPerspectiveConfiguration {
  additionalSpace?: boolean;
  selectDocuments?: boolean;
}

export const defaultDetailPerspectiveConfiguration: DetailPerspectiveConfiguration = {
  additionalSpace: true,
  selectDocuments: true,
};

export interface SearchPerspectiveConfiguration {
  additionalSpace?: boolean;
}

export const defaultSearchPerspectiveConfiguration: SearchPerspectiveConfiguration = {
  additionalSpace: true,
};

export interface TablePerspectiveConfiguration {
  additionalSpace?: boolean;
}

export const defaultTablePerspectiveConfiguration: TablePerspectiveConfiguration = {
  additionalSpace: true,
};

export interface FormPerspectiveConfiguration {
  additionalSpace?: boolean;
}

export const defaultFormPerspectiveConfiguration: FormPerspectiveConfiguration = {
  additionalSpace: true,
};
