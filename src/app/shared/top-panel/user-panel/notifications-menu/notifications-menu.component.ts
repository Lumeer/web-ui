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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {UserNotification, UserNotificationType} from '../../../../core/model/user-notification';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {
  selectAllUserNotifications,
  selectUnreadUserNotifications,
} from '../../../../core/store/user-notifications/user-notifications.state';
import {UserNotificationsAction} from '../../../../core/store/user-notifications/user-notifications.action';
import {UserNotificationsLoaderService} from '../../../../core/service/user-notifications-loader.service';

@Component({
  selector: 'notifications-menu',
  templateUrl: './notifications-menu.component.html',
  styleUrls: ['./notifications-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuComponent implements OnInit {
  public notifications$: Observable<UserNotification[]>;
  public unreadNotifications$: Observable<UserNotification[]>;
  public unreadNotifications: UserNotification[] = [];

  // need to include the notification loader service here for it to initially load notifications and to do that just once
  constructor(private store: Store<AppState>, private notificationsLoader: UserNotificationsLoaderService) {}

  public ngOnInit(): void {
    this.subscribeToNotifications();
    this.unreadNotifications.push({
      id: '111',
      userId: '111',
      read: false,
      createdAt: new Date(),
      type: UserNotificationType.OrganizationShared,
      organizationId: 'aaa',
    });
  }

  private subscribeToNotifications(): void {
    this.notifications$ = this.store.pipe(select(selectAllUserNotifications));
    this.unreadNotifications$ = this.store.pipe(select(selectUnreadUserNotifications));
  }

  private setNotificationReadStatus($event: MouseEvent, notification: UserNotification, read: boolean): void {
    $event.stopPropagation();
    notification.read = read;
    this.store.dispatch(new UserNotificationsAction.Update({userNotification: notification}));
  }
}
