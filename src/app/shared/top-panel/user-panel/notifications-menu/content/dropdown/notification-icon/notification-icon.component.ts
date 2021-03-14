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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  CollectionSharedUserNotification,
  ProjectSharedUserNotification,
  TaskUserNotification,
  UserNotification,
  UserNotificationType,
  ViewSharedUserNotification,
} from '../../../../../../../core/model/user-notification';
import {Dictionary} from '@ngrx/entity';
import {Organization} from '../../../../../../../core/store/organizations/organization';
import {perspectiveIconsMap} from '../../../../../../../view/perspectives/perspective';

@Component({
  selector: '[notification-icon]',
  templateUrl: './notification-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationIconComponent implements OnChanges {
  @Input()
  public notification: UserNotification;

  public projectSharedNotification: ProjectSharedUserNotification;
  public collectionSharedNotification: CollectionSharedUserNotification;
  public viewSharedNotification: ViewSharedUserNotification;
  public taskNotification: TaskUserNotification;

  @Input()
  public organizations: Dictionary<Organization>;

  public readonly notificationType = UserNotificationType;
  public readonly perspectiveIcons = perspectiveIconsMap;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.notification) {
      switch (changes.notification.currentValue.type) {
        case UserNotificationType.ProjectShared:
          this.projectSharedNotification = changes.notification.currentValue;
          break;
        case UserNotificationType.CollectionShared:
          this.collectionSharedNotification = changes.notification.currentValue;
          break;
        case UserNotificationType.ViewShared:
          this.viewSharedNotification = changes.notification.currentValue;
          break;
        case UserNotificationType.TaskAssigned:
        case UserNotificationType.DueDateSoon:
        case UserNotificationType.PastDueDate:
        case UserNotificationType.DueDateChanged:
        case UserNotificationType.StateUpdate:
        case UserNotificationType.TaskUpdated:
        case UserNotificationType.TaskRemoved:
        case UserNotificationType.TaskUnassigned:
        case UserNotificationType.TaskCommented:
        case UserNotificationType.TaskMentioned:
          this.taskNotification = changes.notification.currentValue;
          break;
      }
    }
  }
}
