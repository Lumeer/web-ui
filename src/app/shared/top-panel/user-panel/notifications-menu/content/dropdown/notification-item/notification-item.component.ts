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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {Dictionary} from '@ngrx/entity';

import {UserNotification, UserNotificationType} from '../../../../../../../core/model/user-notification';
import {Organization} from '../../../../../../../core/store/organizations/organization';

@Component({
  selector: 'notification-item',
  templateUrl: './notification-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  @Input()
  public notification: UserNotification;

  @Input()
  public organizations: Dictionary<Organization>;

  @Output()
  public onOpen = new EventEmitter<UserNotification>();

  @Output()
  public onDelete = new EventEmitter<UserNotification>();

  @Output()
  public onRead = new EventEmitter<{notification: UserNotification; read: boolean}>();

  public emitOpen() {
    this.onOpen.emit(this.notification);
  }

  public emitDelete($event: MouseEvent) {
    $event.stopPropagation();
    this.onDelete.emit(this.notification);
  }

  public emitRead($event: MouseEvent, read: boolean) {
    $event.stopPropagation();
    this.onRead.emit({notification: this.notification, read});
  }
}
