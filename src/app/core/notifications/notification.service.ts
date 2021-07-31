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
import {IndividualConfig, ToastrService} from 'ngx-toastr';
import {NotificationButton} from './notification-button';
import {NotificationComponent} from './notification/notification.component';
import {ConfigurationService} from '../../configuration/configuration.service';

@Injectable()
export class NotificationService {
  constructor(private notifications: ToastrService, private configurationService: ConfigurationService) {}

  public success(message: string, config?: Partial<IndividualConfig>) {
    if (!this.configurationService.getConfiguration().notificationsDisabled) {
      this.notifications.success(message, $localize`:@@notification.service.Success:Success`, config);
    }
  }

  public info(message: string, config?: Partial<IndividualConfig>) {
    if (!this.configurationService.getConfiguration().notificationsDisabled) {
      this.notifications.info(message, $localize`:@@notification.service.Info:Info`, config);
    }
  }

  public warning(message: string, config?: Partial<IndividualConfig>) {
    if (!this.configurationService.getConfiguration().notificationsDisabled) {
      this.notifications.warning(message, $localize`:@@notification.service.Warning:Warning`, config);
    }
  }

  public error(message: string, config?: Partial<IndividualConfig>) {
    if (!this.configurationService.getConfiguration().notificationsDisabled) {
      this.notifications.error(message, $localize`:@@notification.service.Error:Error`, config);
    }
  }

  public confirm(
    message: string,
    title: string,
    buttons: NotificationButton[],
    type?: string,
    config?: Partial<IndividualConfig>
  ): NotificationComponent {
    const overrideConfig: Partial<IndividualConfig> = config || {
      disableTimeOut: true,
      tapToDismiss: false,
      positionClass: 'toast-top-center',
    };
    overrideConfig.toastComponent = NotificationComponent;

    const toast = this.notifications.show(message, title, overrideConfig, 'success');
    const component = <NotificationComponent>toast.toastRef.componentInstance;
    component.toastId = toast.toastId;
    component.buttons$.next(buttons);
    component.type$.next(type);
    return component;
  }

  public confirmYesOrNo(message: string, title: string, type: string, onConfirm: () => void, onCancel?: () => void) {
    const yesButtonText = $localize`:@@button.yes:Yes`;
    const yesButton = {text: yesButtonText, action: () => onConfirm()};

    const noButtonText = $localize`:@@button.no:No`;
    const noButton = {text: noButtonText, action: () => onCancel?.()};

    this.confirm(message, title, [noButton, yesButton], type);
  }

  public hint(message: string, title: string, buttons: NotificationButton[]) {
    const component = this.confirm(message, title, buttons, 'success', {
      timeOut: 8000,
      extendedTimeOut: 2000,
      progressBar: true,
      progressAnimation: 'decreasing',
      tapToDismiss: true,
      positionClass: 'toast-top-left',
    });

    component.icon$.next('assets/img/lumeer.svg');
    component.iconClass$.next('lumeer-logo');
  }

  public clear() {
    this.notifications.clear();
  }
}
