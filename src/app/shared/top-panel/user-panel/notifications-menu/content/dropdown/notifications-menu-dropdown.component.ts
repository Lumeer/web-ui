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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {UserNotification, UserNotificationType} from '../../../../../../core/model/user-notification';
import {Dictionary} from '@ngrx/entity';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {Workspace} from '../../../../../../core/store/navigation/workspace';
import {Project} from '../../../../../../core/store/projects/project';
import {DropdownPosition} from '../../../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../../../dropdown/dropdown.component';

@Component({
  selector: 'notifications-menu-dropdown',
  templateUrl: './notifications-menu-dropdown.component.html',
  styleUrls: ['./notifications-menu-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuDropdownComponent implements OnDestroy {
  @Input()
  public unreadNotifications: UserNotification[];

  @Input()
  public allNotifications: UserNotification[];

  @Input()
  public unreadOnly: boolean;

  @Input()
  public organizations: Dictionary<Organization>;

  @Input()
  public workspace: Workspace;

  @Input()
  public currentProject: Project;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public toggleUnread = new EventEmitter();

  @Output()
  public deleteNotification = new EventEmitter<UserNotification>();

  @Output()
  public readNotification = new EventEmitter<{notification: UserNotification; read: boolean}>();

  @Output()
  public clickNotification = new EventEmitter<UserNotification>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly notificationType = UserNotificationType;
  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

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

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public ngOnDestroy() {
    this.close();
  }
}
