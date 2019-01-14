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
import {Chart, DEFAULT_CHART_ID} from './chart';
import {createEntityAdapter, EntityState} from '@ngrx/entity';

export interface ChartsState extends EntityState<Chart> {}

export const chartsAdapter = createEntityAdapter<Chart>({selectId: chart => chart.id});

export const initialChartsState: ChartsState = chartsAdapter.getInitialState();

export const selectChartState = (state: AppState) => state.charts;
export const selectChartsDictionary = createSelector(
  selectChartState,
  chartsAdapter.getSelectors().selectEntities
);
export const selectChartById = id =>
  createSelector(
    selectChartsDictionary,
    charts => charts[id]
  );

export const selectDefaultChart = selectChartById(DEFAULT_CHART_ID);
export const selectChartConfig = createSelector(
  selectDefaultChart,
  chart => chart && chart.config
);
