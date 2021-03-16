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

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {EMPTY, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {Router} from '@angular/router';
import {UserNotificationsAction, UserNotificationsActionType} from './user-notifications.action';
import {UserNotificationsService} from '../../rest/user-notifications.service';
import {UserNotificationConverter} from './user-notification.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectUserNotificationsLoaded} from './user-notifications.state';

@Injectable()
export class UserNotificationsEffects {
  public getUserNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.Get>(UserNotificationsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectUserNotificationsLoaded))),
      filter(([, loaded]) => !loaded),
      mergeMap(() =>
        this.userNotificationsService.getNotifications().pipe(
          map(
            userNotifications =>
              new UserNotificationsAction.GetSuccess({
                userNotifications: UserNotificationConverter.fromDtos(userNotifications),
              })
          ),
          catchError(error => of(new UserNotificationsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.GetFailure>(UserNotificationsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@userNotifications.get.fail:Could not read notifications`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.Update>(UserNotificationsActionType.UPDATE),
      mergeMap(action => {
        const userNotificationDto = UserNotificationConverter.toDto(action.payload.userNotification);

        return this.userNotificationsService
          .updateNotification(action.payload.userNotification.id, userNotificationDto)
          .pipe(
            map(dto => UserNotificationConverter.fromDto(dto)),
            map(userNotification => new UserNotificationsAction.UpdateSuccess({userNotification})),
            catchError(error => of(new UserNotificationsAction.UpdateFailure({error})))
          );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.UpdateFailure>(UserNotificationsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@userNotifications.update.fail:Could not update notification state`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.Delete>(UserNotificationsActionType.DELETE),
      mergeMap(action => {
        if (action.payload.userNotification.deleting !== true) {
          return this.userNotificationsService.removeNotification(action.payload.userNotification.id).pipe(
            map(notificationId => new UserNotificationsAction.DeleteSuccess({id: notificationId})),
            catchError(error =>
              of(new UserNotificationsAction.DeleteFailure({error, id: action.payload.userNotification.id}))
            )
          );
        } else {
          return EMPTY;
        }
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UserNotificationsAction.DeleteFailure>(UserNotificationsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@userNotification.delete.fail:Could not delete notification`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private userNotificationsService: UserNotificationsService
  ) {}
}
