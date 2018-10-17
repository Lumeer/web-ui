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
import {ChartAxisModel, ChartType} from './chart.model';

export enum ChartActionType {

  SELECT_TYPE = '[Chart] Select type',
  SELECT_X_AXIS = '[Chart] Select X axis',
  SELECT_Y1_AXIS = '[Chart] Select Y1 axis',
  SELECT_Y2_AXIS = '[Chart] Select Y2 axis',
  CLEAR = '[Chart] Clear'

}

export namespace ChartAction {

  export class SelectType implements Action {
    public readonly type = ChartActionType.SELECT_TYPE;

    public constructor(public payload: { type: ChartType }) {
    }
  }

  export class SelectXAxis implements Action {
    public readonly type = ChartActionType.SELECT_X_AXIS;

    public constructor(public payload: { axis: ChartAxisModel }) {
    }
  }

  export class SelectY1Axis implements Action {
    public readonly type = ChartActionType.SELECT_Y1_AXIS;

    public constructor(public payload: { axis: ChartAxisModel }) {
    }
  }

  export class SelectY2Axis implements Action {
    public readonly type = ChartActionType.SELECT_Y2_AXIS;

    public constructor(public payload: { axis: ChartAxisModel }) {
    }
  }

  export class Clear implements Action {
    public readonly type = ChartActionType.CLEAR;
  }

  export type All = SelectType | SelectXAxis | SelectY1Axis | SelectY2Axis | Clear;

}
