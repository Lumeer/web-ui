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

import {UsersAction, UsersActionType} from './users.action';
import {initialUsersState, usersAdapter, UsersState} from './users.state';

export function usersReducer(state: UsersState = initialUsersState, action: UsersAction.All): UsersState {
  switch (action.type) {
    case UsersActionType.GET_SUCCESS:
      return {
        ...usersAdapter.setAll(action.payload.users, state),
        loadedForOrganizationId: action.payload.organizationId,
      };
    case UsersActionType.GET_CURRENT_USER_SUCCESS:
      return {...usersAdapter.upsertOne(action.payload.user, state), currentUser: action.payload.user};
    case UsersActionType.CREATE_SUCCESS:
      return usersAdapter.addOne(action.payload.user, state);
    case UsersActionType.INVITE_SUCCESS:
      return usersAdapter.upsertMany(action.payload.users, state);
    case UsersActionType.UPDATE_SUCCESS:
      return usersAdapter.upsertOne(action.payload.user, state);
    case UsersActionType.DELETE_SUCCESS:
      return usersAdapter.removeOne(action.payload.userId, state);
    case UsersActionType.SAVE_DEFAULT_WORKSPACE_SUCCESS:
      const newState = {
        ...state,
        currentUser: {...state.currentUser, defaultWorkspace: action.payload.defaultWorkspace},
      };
      return usersAdapter.updateOne(
        {
          id: action.payload.user.id,
          changes: {defaultWorkspace: action.payload.defaultWorkspace},
        },
        newState
      );
    case UsersActionType.SET_PENDING:
      return {...state, pending: action.payload.pending};
    case UsersActionType.CLEAR:
      return initialUsersState;
    case UsersActionType.REFERRALS_SUCCESS:
      return {...state, currentUser: {...state.currentUser, referrals: action.payload.referrals}};
    case UsersActionType.GET_HINTS_SUCCESS:
      return {...state, currentUser: {...state.currentUser, hints: action.payload.hints}};
    case UsersActionType.UPDATE_HINTS:
      return {...state, currentUser: {...state.currentUser, hints: action.payload.hints}};
    case UsersActionType.UPDATE_HINTS_FAILURE:
      return {...state, currentUser: {...state.currentUser, hints: action.payload.originalHints}};
    default:
      return state;
  }
}
