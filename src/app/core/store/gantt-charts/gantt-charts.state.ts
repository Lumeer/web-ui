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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {GanttChartModel, DEFAULT_GANTT_CHART_ID} from './gantt-chart.model';
import {createEntityAdapter, EntityState} from '@ngrx/entity';

export interface GanttChartsState extends EntityState<GanttChartModel> {
}
export const ganttChartsAdapter = createEntityAdapter<GanttChartModel>({selectId: gantt_chart => gantt_chart.id});

export const initialGanttChartsState: GanttChartsState = ganttChartsAdapter.getInitialState();

export const selectGanttChartState = (state: AppState) => state.ganttCharts;
export const selectGanttChartsDictionary = createSelector(selectGanttChartState, ganttChartsAdapter.getSelectors().selectEntities);
export const selectGanttChartById = (id) => createSelector(selectGanttChartsDictionary, gantt_charts => gantt_charts[id]);

export const selectDefaultGanttChart = selectGanttChartById(DEFAULT_GANTT_CHART_ID);
export const selectGanttChartConfig = createSelector(selectDefaultGanttChart, gantt_chart => gantt_chart && gantt_chart.config);
