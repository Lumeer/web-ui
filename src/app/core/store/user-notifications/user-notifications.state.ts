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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {UserNotification, UserNotificationType} from '../../model/user-notification';
import {AppState} from '../app.state';
import {createSelector} from '@ngrx/store';

export interface UserNotificationsState extends EntityState<UserNotification> {
  loaded: boolean;
}

export const userNotificationsAdapter = createEntityAdapter<UserNotification>({
  selectId: notification => notification.id,
});

export const initialUserNotificationsState: UserNotificationsState = userNotificationsAdapter.getInitialState({
  loaded: false,
});

export const selectUserNotificationsState = (state: AppState) => state.userNotifications;
export const selectAllUserNotifications = createSelector(
  selectUserNotificationsState,
  userNotificationsAdapter.getSelectors().selectAll
);
export const selectAllUserNotificationsSorted = createSelector(
  selectAllUserNotifications,
  userNotifications =>
    userNotifications.sort(
      (a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0)
    )
);
export const selectUnreadUserNotifications = createSelector(
  selectAllUserNotificationsSorted,
  userNotifications => userNotifications.filter(notification => !notification.read)
);
export const selectUserNotificationsByType = (type: UserNotificationType) =>
  createSelector(
    selectAllUserNotificationsSorted,
    userNotifications => userNotifications.filter(notification => notification.type === type)
  );
export const selectUnreadNotificationsByType = (type: UserNotificationType) =>
  createSelector(
    selectAllUserNotificationsSorted,
    userNotifications => userNotifications.filter(notification => !notification.read && notification.type === type)
  );
