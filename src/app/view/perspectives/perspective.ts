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

export const DEFAULT_PERSPECTIVE_ID = 'default';

export enum Perspective {
  Search = 'search',
  Table = 'table',
  Calendar = 'calendar',
  Chart = 'chart',
  Detail = 'detail',
  Kanban = 'kanban',
  Map = 'map',
  Pivot = 'pivot',
  GanttChart = 'ganttChart',
  Workflow = 'workflow',
}

export const perspectivesMap: Record<string, Perspective> = {
  [Perspective.Detail]: Perspective.Detail,
  postit: Perspective.Kanban,
  [Perspective.Kanban]: Perspective.Kanban,
  [Perspective.Pivot]: Perspective.Pivot,
  [Perspective.Chart]: Perspective.Chart,
  [Perspective.Calendar]: Perspective.Calendar,
  [Perspective.GanttChart]: Perspective.GanttChart,
  [Perspective.Map]: Perspective.Map,
  [Perspective.Search]: Perspective.Search,
  [Perspective.Table]: Perspective.Table,
  [Perspective.Workflow]: Perspective.Workflow,
};

export const perspectiveIconsMap: Record<string, string> = {
  [Perspective.Detail]: 'far fa-fw fa-file-search',
  postit: 'far fa-fw fa-columns',
  [Perspective.Kanban]: 'far fa-fw fa-columns',
  [Perspective.Pivot]: 'far fa-fw fa-calculator-alt',
  [Perspective.Chart]: 'far fa-fw fa-chart-area',
  [Perspective.Calendar]: 'far fa-fw fa-calendar-alt',
  [Perspective.GanttChart]: 'fas fa-fw fa-stream',
  [Perspective.Map]: 'far fa-fw fa-map',
  [Perspective.Search]: 'far fa-fw fa-search',
  [Perspective.Table]: 'far fa-fw fa-table',
  [Perspective.Workflow]: 'far fa-fw fa-user-chart',
};
