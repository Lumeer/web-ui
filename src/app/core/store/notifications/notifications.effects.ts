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
import {Store} from '@ngrx/store';
import {tap} from 'rxjs/operators';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../app.state';
import {NotificationsAction, NotificationsActionType} from './notifications.action';
import {Router} from '@angular/router';
import {NotificationButton} from '../../notifications/notification-button';

@Injectable()
export class NotificationsEffects {
  public confirm$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Confirm>(NotificationsActionType.CONFIRM),
        tap(action => {
          const yesButtonText = $localize`:@@button.yes:Yes`;
          const noButtonText = $localize`:@@button.no:No`;
          const yesButton = {text: yesButtonText, action: () => this.store$.dispatch(action.payload.action)};
          const noButton = {text: noButtonText};

          const buttons: NotificationButton[] = [];
          if (action.payload.yesFirst) {
            buttons.push(yesButton);
            buttons.push(noButton);
          } else {
            buttons.push(noButton);
            buttons.push(yesButton);
          }
          this.notificationService.confirm(action.payload.message, action.payload.title, buttons, action.payload.type);
        })
      ),
    {dispatch: false}
  );

  public info$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Info>(NotificationsActionType.INFO),
        tap(action => {
          const okButtonText = $localize`:@@button.ok:OK`;

          const buttons: NotificationButton[] = [{text: okButtonText, bold: true}];
          this.notificationService.confirm(action.payload.message, action.payload.title, buttons);
        })
      ),
    {dispatch: false}
  );

  public error$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Error>(NotificationsActionType.ERROR),
        tap(action => this.notificationService.error(action.payload.message))
      ),
    {dispatch: false}
  );

  public success$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Success>(NotificationsActionType.SUCCESS),
        tap(action => this.notificationService.success(action.payload.message))
      ),
    {dispatch: false}
  );

  public warning$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Warning>(NotificationsActionType.WARNING),
        tap(action => this.notificationService.warning(action.payload.message))
      ),
    {dispatch: false}
  );

  public hint$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.Hint>(NotificationsActionType.HINT),
        tap(action => {
          const lumeerAdvice = $localize`:@@lumeer.advice:Lumeer's Advice`;
          this.notificationService.hint(action.payload.message, lumeerAdvice, action.payload.buttons);
        })
      ),
    {dispatch: false}
  );

  public notifyForceRefresh$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.ForceRefresh>(NotificationsActionType.FORCE_REFRESH),
        tap(() => {
          const message = $localize`:@@warning.force.refresh:I am sorry, the project has been significantly updated by a different user. Please refresh this page in the browser.`;
          const refreshButtonText = $localize`:@@refresh:Refresh`;
          const button: NotificationButton = {
            text: refreshButtonText,
            bold: true,
            action: () => window.location.reload(),
          };

          this.notificationService.confirm(message, '', [button], 'warning');
        })
      ),
    {dispatch: false}
  );

  public existingAttributeWarning$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.ExistingAttributeWarning>(NotificationsActionType.EXISTING_ATTRIBUTE_WARNING),
        tap(action => {
          const message = $localize`:@@warning.attribute.nameExisting:I am sorry, the attribute name '${action.payload.name}:name:' already exists.`;

          this.notificationService.warning(message);
        })
      ),
    {dispatch: false}
  );

  public existingLinkWarning$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<NotificationsAction.ExistingLinkWarning>(NotificationsActionType.EXISTING_LINK_WARNING),
        tap(action => {
          const message = $localize`:@@warning.link.nameExisting:I am sorry, the link name '${action.payload.name}:name:' already exists.`;

          this.notificationService.warning(message);
        })
      ),
    {dispatch: false}
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}
}
