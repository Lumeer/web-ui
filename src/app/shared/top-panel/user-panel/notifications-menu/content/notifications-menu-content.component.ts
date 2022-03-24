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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnInit} from '@angular/core';
import {UserNotification} from '../../../../../core/model/user-notification';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Dictionary} from '@ngrx/entity';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../../core/store/app.state';
import {selectCurrentUser} from '../../../../../core/store/users/users.state';
import {map} from 'rxjs/operators';
import {UsersAction} from '../../../../../core/store/users/users.action';
import {UserHintsKeys} from '../../../../../core/store/users/user';

@Component({
  selector: 'notifications-menu-content',
  templateUrl: './notifications-menu-content.component.html',
  styleUrls: ['./notifications-menu-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuContentComponent implements OnInit {
  @Input()
  public unreadNotifications: UserNotification[];

  @Input()
  public allNotifications: UserNotification[];

  @Input()
  public unreadOnly: boolean;

  @Input()
  public organizations: Dictionary<Organization>;

  @Output()
  public toggleUnread = new EventEmitter();

  @Output()
  public deleteNotification = new EventEmitter<UserNotification>();

  @Output()
  public readNotification = new EventEmitter<{notification: UserNotification; read: boolean}>();

  @Output()
  public clickNotification = new EventEmitter<UserNotification>();

  public displayNotificationsHint$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  ngOnInit(): void {
    this.displayNotificationsHint$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => user.hints.inviteUsersHintDismissed && !user.hints.notificationsHintDismissed)
    );
  }

  onHintDismissed() {
    this.store$.dispatch(new UsersAction.SetHint({hint: UserHintsKeys.notificationsHintDismissed, value: true}));
  }
}
