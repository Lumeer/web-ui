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
import {KanbansState, initialKanbansState, kanbansAdapter} from './kanban.state';
import {KanbansAction, KanbansActionType} from './kanbans.action';

export function kanbansReducer(state: KanbansState = initialKanbansState, action: KanbansAction.All): KanbansState {
  switch (action.type) {
    case KanbansActionType.ADD_KANBAN:
      return kanbansAdapter.upsertOne(action.payload.kanban, state);
    case KanbansActionType.REMOVE_KANBAN:
      return kanbansAdapter.removeOne(action.payload.kanbanId, state);
    case KanbansActionType.SET_CONFIG:
      return kanbansAdapter.updateOne({id: action.payload.kanbanId, changes: {config: action.payload.config}}, state);
    case KanbansActionType.CLEAR:
      return initialKanbansState;
    default:
      return state;
  }
}
