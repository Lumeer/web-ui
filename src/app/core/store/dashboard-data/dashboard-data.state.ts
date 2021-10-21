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

import {EntityState, EntityAdapter, createEntityAdapter} from '@ngrx/entity';
import {DashboardData, DashboardDataType} from './dashboard-data';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';

export interface DashboardDataState extends EntityState<DashboardData> {
  loaded?: boolean;
}

export const dashboardDataAdapter: EntityAdapter<DashboardData> = createEntityAdapter<DashboardData>({
  selectId: data => dashboardDataSelectorId(data),
});

export const initialDashboardDataState: DashboardDataState = dashboardDataAdapter.getInitialState();

export const selectDashboardDataState = (state: AppState) => state.dashboardData;

export const selectDashboardDataEntities = createSelector(
  selectDashboardDataState,
  dashboardDataAdapter.getSelectors().selectEntities
);

export const selectDashboardDataObjects = createSelector(
  selectDashboardDataState,
  dashboardDataAdapter.getSelectors().selectEntities
);

export const selectDashboardDataByType = (type: DashboardDataType, id: string) =>
  createSelector(selectDashboardDataEntities, entities => entities[dashboardDataPropertiesSelectorId(type, id)]);

export const selectDashboardDataLoaded = createSelector(selectDashboardDataState, state => state.loaded);

export function dashboardDataSelectorId(data: DashboardData): string {
  return dashboardDataPropertiesSelectorId(data.type, data.typeId);
}

export function dashboardDataPropertiesSelectorId(type: DashboardDataType, id: string): string {
  return `${type}:${id}`;
}
