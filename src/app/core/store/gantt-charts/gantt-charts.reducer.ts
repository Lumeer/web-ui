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

import {ganttChartsAdapter, GanttChartsState, initialGanttChartsState} from './gantt-charts.state';
import {GanttChartAction, GanttChartActionType} from './gantt-charts.action';

export function ganttChartsReducer(
  state: GanttChartsState = initialGanttChartsState,
  action: GanttChartAction.All
): GanttChartsState {
  switch (action.type) {
    case GanttChartActionType.ADD_GANTT_CHART:
      return ganttChartsAdapter.addOne(action.payload.ganttChart, state);
    case GanttChartActionType.REMOVE_GANTT_CHART:
      return ganttChartsAdapter.removeOne(action.payload.ganttChartId, state);
    case GanttChartActionType.SET_CONFIG:
      return ganttChartsAdapter.updateOne(
        {id: action.payload.ganttChartId, changes: {config: action.payload.config}},
        state
      );
    case GanttChartActionType.CLEAR:
      return initialGanttChartsState;
    default:
      return state;
  }
}
