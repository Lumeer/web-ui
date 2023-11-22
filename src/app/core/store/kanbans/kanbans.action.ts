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

import {Kanban, KanbanConfig} from './kanban';

export enum KanbansActionType {
  ADD_KANBAN = '[Kanban] Add kanban',
  REMOVE_KANBAN = '[Kanban] Remove kanban',

  SET_CONFIG = '[Kanban] Set config',

  CLEAR = '[Kanban] Clear',
}

export namespace KanbansAction {
  export class AddKanban implements Action {
    public readonly type = KanbansActionType.ADD_KANBAN;

    public constructor(public payload: {kanban: Kanban}) {}
  }

  export class RemoveKanban implements Action {
    public readonly type = KanbansActionType.REMOVE_KANBAN;

    public constructor(public payload: {kanbanId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = KanbansActionType.SET_CONFIG;

    public constructor(public payload: {kanbanId: string; config: KanbanConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = KanbansActionType.CLEAR;
  }

  export type All = AddKanban | RemoveKanban | SetConfig | Clear;
}
