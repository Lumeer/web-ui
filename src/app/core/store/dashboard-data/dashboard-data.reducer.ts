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

import {createReducer, on} from '@ngrx/store';
import * as DashboardDataActions from './dashboard-data.actions';
import {
  dashboardDataAdapter,
  dashboardDataPropertiesSelectorId,
  initialDashboardDataState,
} from './dashboard-data.state';

export const dashboardDataReducer = createReducer(
  initialDashboardDataState,
  on(DashboardDataActions.getSuccess, (state, action) =>
    dashboardDataAdapter.upsertMany(action.data, {...state, loaded: true})
  ),
  on(DashboardDataActions.getOneSuccess, (state, action) => dashboardDataAdapter.upsertOne(action.data, {...state})),
  on(DashboardDataActions.updateSuccess, (state, action) =>
    dashboardDataAdapter.upsertOne(action.dashboardData, state)
  ),
  on(DashboardDataActions.updateFailure, (state, action) =>
    dashboardDataAdapter.upsertOne(action.dashboardData, state)
  ),
  on(DashboardDataActions.deleteDataSuccess, (state, action) =>
    dashboardDataAdapter.removeMany(
      action.ids.map(id => dashboardDataPropertiesSelectorId(action.dataType, id)),
      state
    )
  ),
  on(DashboardDataActions.clear, () => initialDashboardDataState)
);
