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

import {Action} from '@ngrx/store';
import {ChartConfig, Chart} from './chart';

export enum ChartActionType {
  ADD_CHART = '[Chart] Add chart',
  REMOVE_CHART = '[Chart] Remove chart',

  SET_CONFIG = '[Chart] Set config',

  CLEAR = '[Chart] Clear',
}

export namespace ChartAction {
  export class AddChart implements Action {
    public readonly type = ChartActionType.ADD_CHART;

    public constructor(public payload: {chart: Chart}) {}
  }

  export class RemoveChart implements Action {
    public readonly type = ChartActionType.REMOVE_CHART;

    public constructor(public payload: {chartId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = ChartActionType.SET_CONFIG;

    public constructor(public payload: {chartId: string; config: ChartConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = ChartActionType.CLEAR;
  }

  export type All = AddChart | RemoveChart | SetConfig | Clear;
}
