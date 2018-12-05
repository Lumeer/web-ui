import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {UserNotification, UserNotificationType} from '../../../../core/model/user-notification';

@Component({
  selector: 'notifications-menu',
  templateUrl: './notifications-menu.component.html',
  styleUrls: ['./notifications-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuComponent implements OnInit {
  public notifications: UserNotification[] = [];
  public unreadNotifications: UserNotification[] = [];

  constructor() {}

  public ngOnInit(): void {
    this.notifications.push({
      id: '111',
      userId: '111',
      read: false,
      createdAt: new Date(),
      type: UserNotificationType.OrganizationShared,
      organizationId: 'aaa',
    });
  }
}
