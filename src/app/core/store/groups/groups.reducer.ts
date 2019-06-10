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

import {GroupsAction, GroupsActionType} from './groups.action';
import {groupsAdapter, GroupsState, initialGroupsState} from './groups.state';

export function groupsReducer(state: GroupsState = initialGroupsState, action: GroupsAction.All): GroupsState {
  switch (action.type) {
    case GroupsActionType.GET_SUCCESS:
      return groupsAdapter.addAll(action.payload.groups, state);
    case GroupsActionType.CREATE_SUCCESS:
      return groupsAdapter.addOne(action.payload.group, state);
    case GroupsActionType.UPDATE_SUCCESS:
      return groupsAdapter.updateOne({id: action.payload.group.id, changes: action.payload.group}, state);
    case GroupsActionType.DELETE_SUCCESS:
      return groupsAdapter.removeOne(action.payload.groupId, state);
    case GroupsActionType.CLEAR:
      return initialGroupsState;
    default:
      return state;
  }
}
