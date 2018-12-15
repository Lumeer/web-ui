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

import {
  initialUserNotificationsState,
  userNotificationsAdapter,
  UserNotificationsState,
} from './user-notifications.state';
import {UserNotificationsAction, UserNotificationsActionType} from './user-notifications.action';

export function userNotificationsReducer(
  state: UserNotificationsState = initialUserNotificationsState,
  action: UserNotificationsAction.All
): UserNotificationsState {
  switch (action.type) {
    case UserNotificationsActionType.GET_SUCCESS:
      return {
        ...userNotificationsAdapter.upsertMany(action.payload.userNotifications, state),
        loaded: true,
      };
    case UserNotificationsActionType.UPDATE_SUCCESS:
      return userNotificationsAdapter.upsertOne(action.payload.userNotification, state);
    case UserNotificationsActionType.DELETE_SUCCESS:
      return userNotificationsAdapter.removeOne(action.payload.id, state);
    default:
      return state;
  }
}
