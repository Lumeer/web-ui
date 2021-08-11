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
import {UserNotification, UserNotificationType} from '../../../../../../../core/model/user-notification';
import {Dictionary} from '@ngrx/entity';
import {Organization} from '../../../../../../../core/store/organizations/organization';

@Component({
  selector: '[notification-text]',
  templateUrl: './notification-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationTextComponent implements OnChanges {
  @Input()
  public notification: UserNotification;

  @Input()
  public organizations: Dictionary<Organization>;

  public taskName: string;
  public taskState: string;
  public taskDueDate: string;

  public readonly notificationType = UserNotificationType;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.notification && changes.notification.currentValue) {
      switch (changes.notification.currentValue.type) {
        case UserNotificationType.TaskAssigned:
        case UserNotificationType.TaskReopened:
        case UserNotificationType.DueDateSoon:
        case UserNotificationType.PastDueDate:
        case UserNotificationType.DueDateChanged:
        case UserNotificationType.StateUpdate:
        case UserNotificationType.TaskUpdated:
        case UserNotificationType.TaskChanged:
        case UserNotificationType.TaskRemoved:
        case UserNotificationType.TaskUnassigned:
        case UserNotificationType.TaskCommented:
        case UserNotificationType.TaskMentioned:
          this.taskName = changes.notification.currentValue.taskName;
          this.taskState = changes.notification.currentValue.taskState;
          this.taskDueDate = changes.notification.currentValue.taskDueDate;
      }
    }
  }
}
