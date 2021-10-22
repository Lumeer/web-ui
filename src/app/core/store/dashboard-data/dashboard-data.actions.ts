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

import {createAction, props} from '@ngrx/store';

import {DashboardData, DashboardDataType} from './dashboard-data';
import {Workspace} from '../navigation/workspace';
import {Dashboard} from '../searches/search';

export const get = createAction('[DashboardData] Get', props<{workspace?: Workspace}>());

export const getOne = createAction(
  '[DashboardData] Get One',
  props<{workspace?: Workspace; dataType: DashboardDataType; id: string}>()
);

export const getSuccess = createAction('[DashboardData] Get :: Success', props<{data: DashboardData[]}>());

export const getOneSuccess = createAction('[DashboardData] Get One :: Success', props<{data: DashboardData}>());

export const getFailure = createAction('[DashboardData] Get :: Failure', props<{error: any}>());

export const update = createAction('[DashboardData] Update', props<{dashboardData: DashboardData}>());

export const updateSuccess = createAction('[DashboardData] Update :: Success', props<{dashboardData: DashboardData}>());

export const updateFailure = createAction(
  '[DashboardData] Update :: Failure',
  props<{error: any; dashboardData: DashboardData}>()
);

export const checkDeletedData = createAction(
  '[DashboardData] Check Deleted Data',
  props<{oldDashboard: Dashboard; currentDashboard: Dashboard}>()
);

export const deleteData = createAction('[DashboardData] Delete', props<{dataType: DashboardDataType; ids: string[]}>());

export const deleteDataSuccess = createAction(
  '[DashboardData] Delete :: Success',
  props<{dataType: DashboardDataType; ids: string[]}>()
);

export const clear = createAction('[DashboardData] Clear');
