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

import {Injectable, NgZone} from '@angular/core';
import {Snotify, SnotifyButton, SnotifyPosition, SnotifyService} from 'ng-snotify';
import {Observable} from 'rxjs/Observable';
import {UserSettingsService} from '../user-settings.service';

@Injectable()
export class NotificationService {

  constructor(private zone: NgZone,
              private notifications: SnotifyService,
              private userSettingsService: UserSettingsService) {
  }

  public simple(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.simple(message, 'Hey'));
  }

  public success(message: string): void {
    console.log('success');
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.success(message, 'Success'));
  }

  public info(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.info(message, 'Info'));
  }

  public warning(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.warning(message, 'Warning'));
  }

  public error(message: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.error(message, 'Error'));
  }

  public async(message: string, finishAction: Promise<Snotify> | Observable<Snotify>): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.async(message, finishAction));
  }

  public prompt(message: string, title: string, buttons: SnotifyButton[], placeholder: string): void {
    this.zone.runOutsideAngular(() => this.notifications.prompt(
      message,
      title,
      {buttons: buttons, placeholder: placeholder, position: SnotifyPosition.centerTop, timeout: null})
    );
  }

  public confirm(message: string, title: string, buttons: SnotifyButton[]): void {
    this.zone.runOutsideAngular(() => this.notifications.confirm(
      message,
      title,
      {timeout: null, buttons: buttons, position: SnotifyPosition.centerTop, closeOnClick: true}));
  }

  public html(html: string): void {
    if (this.areNotificationsDisabled()) {
      return;
    }
    this.zone.runOutsideAngular(() => this.notifications.html(html));
  }

  private areNotificationsDisabled(): boolean {
    return this.userSettingsService.getUserSettings().notificationsDisabled;
  }

}
