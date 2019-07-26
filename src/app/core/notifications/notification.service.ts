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

import {Injectable, NgZone} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Snotify, SnotifyButton, SnotifyPosition, SnotifyService, SnotifyToastConfig} from 'ng-snotify';
import {Observable} from 'rxjs';
import {UserSettingsService} from '../service/user-settings.service';
import {SnotifyType} from 'ng-snotify/snotify/types/snotify.type';

@Injectable()
export class NotificationService {
  constructor(
    private zone: NgZone,
    private notifications: SnotifyService,
    private userSettingsService: UserSettingsService,
    private i18n: I18n
  ) {}

  public simple(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() =>
      this.notifications.simple(message, this.i18n({id: 'notification.service.Hey', value: 'Hey'}))
    );
  }

  public success(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() =>
      this.notifications.success(message, this.i18n({id: 'notification.service.Success', value: 'Success'}))
    );
  }

  public info(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() =>
      this.notifications.info(message, this.i18n({id: 'notification.service.Info', value: 'Info'}), {timeout: 5000})
    );
  }

  public warning(message: string, config?: SnotifyToastConfig): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() =>
      this.notifications.warning(message, this.i18n({id: 'notification.service.Warning', value: 'Warning'}), config)
    );
  }

  public error(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() =>
      this.notifications.error(message, this.i18n({id: 'notification.service.Error', value: 'Error'}))
    );
  }

  public async(message: string, finishAction: Promise<Snotify> | Observable<Snotify>): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.async(message, finishAction));
  }

  public prompt(message: string, title: string, buttons: SnotifyButton[], placeholder: string): void {
    this.zone.runOutsideAngular(() =>
      this.notifications.prompt(message, title, {
        buttons,
        placeholder,
        position: SnotifyPosition.centerTop,
        timeout: null,
      })
    );
  }

  public confirm(message: string, title: string, buttons: SnotifyButton[]): void {
    this.zone.runOutsideAngular(() =>
      this.notifications.confirm(message, title, {
        timeout: null,
        buttons: buttons,
        position: SnotifyPosition.centerTop,
        closeOnClick: true,
      })
    );
  }

  public confirmYesOrNo(message: string, title: string, onConfirm: () => void, onCancel?: () => void) {
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const yesButton = {text: yesButtonText, action: () => onConfirm()};

    const noButtonText = this.i18n({id: 'button.no', value: 'No'});
    const noButton = {text: noButtonText, action: () => onCancel && onCancel()};

    this.confirm(message, title, [noButton, yesButton]);
  }

  public hint(message: string, title: string, buttons: SnotifyButton[]): void {
    this.zone.runOutsideAngular(() =>
      this.notifications.success(message, title, {
        timeout: 8000,
        icon: 'assets/img/lumeer.svg',
        iconClass: 'lumeer-logo',
        pauseOnHover: true,
        closeOnClick: true,
        showProgressBar: true,
        buttons: buttons,
        type: 'success',
        position: SnotifyPosition.leftTop,
      })
    );
  }

  public html(html: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.html(html));
  }

  public remove(id: number) {
    this.zone.runOutsideAngular(() => this.notifications.remove(id));
  }

  public clear() {
    this.zone.runOutsideAngular(() => this.notifications.clear());
  }

  private areNotificationsDisabled(): boolean {
    return this.userSettingsService.getUserSettings().notificationsDisabled;
  }
}
