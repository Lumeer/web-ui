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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {UserNotification} from '../../../../../core/model/user-notification';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {Project} from '../../../../../core/store/projects/project';

@Component({
  selector: 'notifications-menu-wrapper',
  templateUrl: './notifications-menu-wrapper.component.html',
  styleUrls: ['./notifications-menu-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuWrapperComponent {
  @Input()
  public unreadNotifications: UserNotification[];

  @Input()
  public allNotifications: UserNotification[];

  @Input()
  public unreadOnly: boolean;

  @Input()
  public organizations: Organization;

  @Input()
  public workspace: Workspace;

  @Input()
  public currentProject: Project;

  @Output()
  public toggleUnread = new EventEmitter();

  @Output()
  public deleteNotification = new EventEmitter<UserNotification>();

  @Output()
  public readNotification = new EventEmitter<{notification: UserNotification; read: boolean}>();

  @Output()
  public clickNotification = new EventEmitter<UserNotification>();

  public toggleUnreadFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleUnread.emit();
  }

  public deleteNotificationEvent(event: MouseEvent, notification: UserNotification) {
    event.stopPropagation();
    this.deleteNotification.next(notification);
  }

  public setNotificationReadEvent(event: MouseEvent, notification: UserNotification, read: boolean): void {
    event.stopPropagation();
    this.readNotification.next({notification, read});
  }

  public navigateToTarget(notification: UserNotification) {
    this.clickNotification.next(notification);
  }
}
