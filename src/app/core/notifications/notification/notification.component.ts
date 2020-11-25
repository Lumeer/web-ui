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

import {Component} from '@angular/core';
import {Toast} from 'ngx-toastr';
import {BehaviorSubject} from 'rxjs';
import {NotificationButton} from '../notification-button';

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent extends Toast {
  public toastId: number;

  public buttons$ = new BehaviorSubject<NotificationButton[]>([]);
  public type$ = new BehaviorSubject<string>('');
  public icon$ = new BehaviorSubject<string>(null);
  public iconClass$ = new BehaviorSubject<string>(null);

  public onButtonClick($event, button: NotificationButton) {
    $event.stopPropagation();
    button.action?.();
    this.toastrService.clear(this.toastId);
  }
}
