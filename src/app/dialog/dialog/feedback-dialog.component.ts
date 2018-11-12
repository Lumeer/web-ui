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

import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../core/notifications/notification.service';
import {UserService} from '../../core/rest';
import {DialogService} from '../dialog.service';

const FEEDBACK_KEY = 'feedback_message';

@Component({
  selector: 'feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
})
export class FeedbackDialogComponent implements OnInit {
  public readonly form = new FormGroup({
    message: new FormControl('', Validators.required),
  });

  public constructor(
    private dialogService: DialogService,
    private i18n: I18n,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  public ngOnInit() {
    this.message.setValue(localStorage.getItem(FEEDBACK_KEY) || '');
  }

  public onSubmit() {
    this.form.markAsTouched();
    this.message.markAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.sendFeedback(this.message.value);
  }

  private sendFeedback(message: string) {
    this.userService.sendFeedback(message).subscribe(
      () => {
        this.notifyOnSuccess();
        localStorage.removeItem(FEEDBACK_KEY);
      },
      () => this.notifyOnError()
    );
  }

  private notifyOnSuccess() {
    const message = this.i18n({id: 'dialog.feedback.success', value: 'Your feedback has been sent.'});
    this.notificationService.success(message);
  }

  private notifyOnError() {
    const message = this.i18n({id: 'dialog.feedback.error', value: 'Could not send feedback.'});
    this.notificationService.error(message);
  }

  public onMessageChange(event: KeyboardEvent) {
    localStorage.setItem(FEEDBACK_KEY, event.target['value']);
  }

  public get message(): AbstractControl {
    return this.form.get('message');
  }
}
