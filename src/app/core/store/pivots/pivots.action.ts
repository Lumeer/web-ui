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

import {LmrPivotConfig} from '@lumeer/pivot';

import {Pivot} from './pivot';

export enum PivotsActionType {
  ADD_PIVOT = '[Pivot] Add pivot',
  REMOVE_PIVOT = '[Pivot] Remove pivot',

  SET_CONFIG = '[Pivot] Set config',

  CLEAR = '[Pivot] Clear',
}

export namespace PivotsAction {
  export class AddPivot implements Action {
    public readonly type = PivotsActionType.ADD_PIVOT;

    public constructor(public payload: {pivot: Pivot}) {}
  }

  export class RemovePivot implements Action {
    public readonly type = PivotsActionType.REMOVE_PIVOT;

    public constructor(public payload: {pivotId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = PivotsActionType.SET_CONFIG;

    public constructor(public payload: {pivotId: string; config: LmrPivotConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = PivotsActionType.CLEAR;
  }

  export type All = AddPivot | RemovePivot | SetConfig | Clear;
}
