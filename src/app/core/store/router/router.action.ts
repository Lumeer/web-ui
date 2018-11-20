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

import {NavigationExtras} from '@angular/router';
import {Params} from '@angular/router/src/shared';
import {Action} from '@ngrx/store';

export enum RouterActionType {
  GO = '[Router] Go',
  BACK = '[Router] Back',
  FORWARD = '[Router] Forward',
}

export namespace RouterAction {
  export class Go implements Action {
    public readonly type = RouterActionType.GO;

    constructor(
      public payload: {
        path: any[];
        queryParams?: Params;
        extras?: NavigationExtras;
      }
    ) {}
  }

  export class Back implements Action {
    public readonly type = RouterActionType.BACK;
  }

  export class Forward implements Action {
    public readonly type = RouterActionType.FORWARD;
  }

  export type All = Go | Back | Forward;
}
