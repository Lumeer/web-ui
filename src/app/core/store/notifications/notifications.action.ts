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

import {Action} from '@ngrx/store';
import {NotificationButton} from '../../notifications/notification-button';

export enum NotificationsActionType {
  CONFIRM = '[Notifications] Confirm',
  INFO = '[Notifications] Info',
  ERROR = '[Notifications] Error',
  SUCCESS = '[Notifications] Success',
  WARNING = '[Notifications] Warning',
  HINT = '[Notifications] Hint',

  FORCE_REFRESH = '[Notifications] Force Refresh',
  EXISTING_ATTRIBUTE_WARNING = '[Notifications] Existing Attribute Warning',
  EXISTING_LINK_WARNING = '[Notifications] Existing Link Warning',
}

export namespace NotificationsAction {
  export class Confirm implements Action {
    public readonly type = NotificationsActionType.CONFIRM;

    public constructor(
      public payload: {title: string; message: string; action: Action; type: string; yesFirst?: boolean}
    ) {}
  }

  export class Info implements Action {
    public readonly type = NotificationsActionType.INFO;

    public constructor(public payload: {title: string; message: string}) {}
  }

  export class Error implements Action {
    public readonly type = NotificationsActionType.ERROR;

    public constructor(public payload: {message: string}) {}
  }

  export class Success implements Action {
    public readonly type = NotificationsActionType.SUCCESS;

    public constructor(public payload: {message: string}) {}
  }

  export class Warning implements Action {
    public readonly type = NotificationsActionType.WARNING;

    public constructor(public payload: {message: string}) {}
  }

  export class Hint implements Action {
    public readonly type = NotificationsActionType.HINT;

    public constructor(public payload: {message: string; buttons: NotificationButton[]}) {}
  }

  export class ForceRefresh implements Action {
    public readonly type = NotificationsActionType.FORCE_REFRESH;
  }

  export class ExistingAttributeWarning implements Action {
    public readonly type = NotificationsActionType.EXISTING_ATTRIBUTE_WARNING;

    public constructor(public payload: {name: string}) {}
  }

  export class ExistingLinkWarning implements Action {
    public readonly type = NotificationsActionType.EXISTING_LINK_WARNING;

    public constructor(public payload: {name: string}) {}
  }
}
