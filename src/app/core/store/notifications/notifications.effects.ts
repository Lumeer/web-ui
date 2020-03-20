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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {tap} from 'rxjs/operators';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../app.state';
import {NotificationsAction, NotificationsActionType} from './notifications.action';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {NotificationButton} from '../../notifications/notification-button';

@Injectable()
export class NotificationsEffects {
  @Effect({dispatch: false})
  public confirm$ = this.actions$.pipe(
    ofType<NotificationsAction.Confirm>(NotificationsActionType.CONFIRM),
    tap(action => {
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});
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
  );

  @Effect({dispatch: false})
  public info$ = this.actions$.pipe(
    ofType<NotificationsAction.Info>(NotificationsActionType.INFO),
    tap(action => {
      const okButtonText = this.i18n({id: 'button.ok', value: 'OK'});

      const buttons: NotificationButton[] = [{text: okButtonText, bold: true}];
      this.notificationService.confirm(action.payload.message, action.payload.title, buttons);
    })
  );

  @Effect({dispatch: false})
  public error$ = this.actions$.pipe(
    ofType<NotificationsAction.Error>(NotificationsActionType.ERROR),
    tap(action => this.notificationService.error(action.payload.message))
  );

  @Effect({dispatch: false})
  public success$ = this.actions$.pipe(
    ofType<NotificationsAction.Success>(NotificationsActionType.SUCCESS),
    tap(action => this.notificationService.success(action.payload.message))
  );

  @Effect({dispatch: false})
  public warning$ = this.actions$.pipe(
    ofType<NotificationsAction.Warning>(NotificationsActionType.WARNING),
    tap(action => this.notificationService.warning(action.payload.message))
  );

  @Effect({dispatch: false})
  public hint$ = this.actions$.pipe(
    ofType<NotificationsAction.Hint>(NotificationsActionType.HINT),
    tap(action => {
      const lumeerAdvice = this.i18n({id: 'lumeer.advice', value: "Lumeer's Advice"});
      this.notificationService.hint(action.payload.message, lumeerAdvice, action.payload.buttons);
    })
  );

  @Effect({dispatch: false})
  public notifyForceRefresh$: Observable<Action> = this.actions$.pipe(
    ofType<NotificationsAction.ForceRefresh>(NotificationsActionType.FORCE_REFRESH),
    tap(() => {
      const message = this.i18n({
        id: 'warning.force.refresh',
        value:
          'I am sorry, the project has been significantly updated by a different user. Please refresh this page in the browser.',
      });
      const refreshButtonText = this.i18n({id: 'refresh', value: 'Refresh'});
      const button: NotificationButton = {
        text: refreshButtonText,
        bold: true,
        action: () => (window.location.href = '/'),
      };

      this.notificationService.confirm(message, '', [button], 'warning');
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private router: Router,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}
}
