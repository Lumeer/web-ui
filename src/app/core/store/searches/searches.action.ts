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
import {Search, SearchConfig} from './search';

export enum SearchesActionType {
  ADD_SEARCH = '[Search] Add search',
  REMOVE_SEARCH = '[Search] Remove search',

  SET_CONFIG = '[Search] Set config',

  CLEAR = '[Search] Clear',
}

export namespace SearchesAction {
  export class AddSearch implements Action {
    public readonly type = SearchesActionType.ADD_SEARCH;

    public constructor(public payload: {search: Search}) {}
  }

  export class RemoveSearch implements Action {
    public readonly type = SearchesActionType.REMOVE_SEARCH;

    public constructor(public payload: {searchId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = SearchesActionType.SET_CONFIG;

    public constructor(public payload: {searchId: string; config: SearchConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = SearchesActionType.CLEAR;
  }

  export type All = AddSearch | RemoveSearch | SetConfig | Clear;
}
