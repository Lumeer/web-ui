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

import {Action} from '@ngrx/store';
import {UserNotification} from '../../model/user-notification';

export enum UserNotificationsActionType {
  GET = '[UserNotifications] Get',
  GET_SUCCESS = '[UserNotifications] Get :: Success',
  GET_FAILURE = '[UserNotifications] Get :: Failure',

  UPDATE = '[UserNotifications] Update',
  UPDATE_SUCCESS = '[UserNotifications] Update :: Success',
  UPDATE_FAILURE = '[UserNotifications] Update :: Failure',

  DELETE = '[UserNotifications] Delete',
  DELETE_SUCCESS = '[UserNotifications] Delete :: Success',
  DELETE_FAILURE = '[UserNotifications] Delete :: Failure',
}

export namespace UserNotificationsAction {
  export class Get implements Action {
    public readonly type = UserNotificationsActionType.GET;
  }

  export class GetSuccess implements Action {
    public readonly type = UserNotificationsActionType.GET_SUCCESS;

    public constructor(public payload: {userNotifications: UserNotification[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = UserNotificationsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Update implements Action {
    public readonly type = UserNotificationsActionType.UPDATE;

    public constructor(public payload: {userNotification: UserNotification}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = UserNotificationsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {userNotification: UserNotification}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = UserNotificationsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = UserNotificationsActionType.DELETE;

    public constructor(public payload: {id: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = UserNotificationsActionType.DELETE_SUCCESS;

    public constructor(public payload: {id: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = UserNotificationsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure;
}
