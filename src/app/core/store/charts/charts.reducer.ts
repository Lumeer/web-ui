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

import {chartsAdapter, ChartsState, initialChartsState} from './charts.state';
import {ChartAction, ChartActionType} from './charts.action';

export function chartsReducer(state: ChartsState = initialChartsState, action: ChartAction.All): ChartsState {
  switch (action.type) {
    case ChartActionType.ADD_CHART:
      return chartsAdapter.addOne(action.payload.chart, state);
    case ChartActionType.REMOVE_CHART:
      return chartsAdapter.removeOne(action.payload.chartId, state);
    case ChartActionType.SET_CONFIG:
      return chartsAdapter.updateOne({id: action.payload.chartId, changes: {config: action.payload.config}}, state);
    case ChartActionType.CLEAR:
      return initialChartsState;
    default:
      return state;
  }
}
