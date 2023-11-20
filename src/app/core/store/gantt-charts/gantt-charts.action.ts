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
import {Action} from '@ngrx/store';

import {GanttChart, GanttChartConfig} from './gantt-chart';

export enum GanttChartActionType {
  ADD_GANTT_CHART = '[Gantt Chart] Add gantt chart',
  REMOVE_GANTT_CHART = '[Gantt Chart] Remove gantt chart',

  SET_CONFIG = '[Gantt Chart] Set config',

  CLEAR = '[Gantt Chart] Clear',
}

export namespace GanttChartAction {
  export class AddGanttChart implements Action {
    public readonly type = GanttChartActionType.ADD_GANTT_CHART;

    public constructor(public payload: {ganttChart: GanttChart}) {}
  }

  export class RemoveGanttChart implements Action {
    public readonly type = GanttChartActionType.REMOVE_GANTT_CHART;

    public constructor(public payload: {ganttChartId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = GanttChartActionType.SET_CONFIG;

    public constructor(public payload: {ganttChartId: string; config: GanttChartConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = GanttChartActionType.CLEAR;
  }

  export type All = AddGanttChart | RemoveGanttChart | SetConfig | Clear;
}
