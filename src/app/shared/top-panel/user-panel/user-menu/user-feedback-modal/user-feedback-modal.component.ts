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

import {Component, OnInit, ChangeDetectionStrategy, HostListener} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from '../../../../../core/notifications/notification.service';
import {Angulartics2} from 'angulartics2';
import {BsModalRef} from 'ngx-bootstrap/modal';
import mixpanel from 'mixpanel-browser';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {KeyCode} from '../../../../key-code';
import {DialogType} from '../../../../modal/dialog-type';
import {UserService} from '../../../../../core/data-service';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

@Component({
  selector: 'user-feedback-modal',
  templateUrl: './user-feedback-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFeedbackModalComponent implements OnInit {
  public readonly form = new FormGroup({
    message: new FormControl('', Validators.required),
  });

  public readonly dialogType = DialogType;

  public formInvalid$: Observable<boolean>;
  public performingAction$ = new BehaviorSubject(false);

  public constructor(
    private bsRef: BsModalRef,
    private notificationService: NotificationService,
    private userService: UserService,
    private angulartics2: Angulartics2,
    private configurationService: ConfigurationService
  ) {}

  public ngOnInit() {
    this.formInvalid$ = this.form.valueChanges.pipe(
      map(() => this.form.invalid),
      startWith(true)
    );
  }

  public get message(): AbstractControl {
    return this.form.get('message');
  }

  public onSubmit() {
    this.form.markAsTouched();
    this.message.markAsTouched();

    this.sendFeedback(this.message.value);
  }

  private sendFeedback(message: string) {
    this.performingAction$.next(true);

    this.userService.sendFeedback(message).subscribe(
      () => {
        if (this.configurationService.getConfiguration().analytics) {
          this.angulartics2.eventTrack.next({
            action: 'Feedback send',
            properties: {
              category: 'Feedback',
            },
          });

          if (this.configurationService.getConfiguration().mixpanelKey) {
            mixpanel.track('Feedback Send');
          }
        }
        this.notifyOnSuccess();
      },
      () => this.notifyOnError()
    );
  }

  private notifyOnSuccess() {
    const message = $localize`:@@dialog.feedback.success:Your feedback has been sent.`;
    this.notificationService.success(message);

    this.hideDialog();
  }

  private notifyOnError() {
    const message = $localize`:@@dialog.feedback.error:Could not send feedback.`;
    this.notificationService.error(message);

    this.performingAction$.next(false);
  }

  public hideDialog() {
    this.bsRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
