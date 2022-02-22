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
import {Angulartics2} from 'angulartics2';
import {BsModalRef} from 'ngx-bootstrap/modal';
import mixpanel from 'mixpanel-browser';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {NotificationService} from '../../../core/notifications/notification.service';
import {UserService} from '../../../core/data-service';
import {DialogType} from '../dialog-type';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {minLengthValidator, notEmptyValidator} from '../../../core/validators/custom-validators';

@Component({
  templateUrl: './book-product-demo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookProductDemoModalComponent implements OnInit {
  public readonly form = new FormGroup({
    name: new FormControl('', notEmptyValidator()),
    industry: new FormControl('', notEmptyValidator()),
    numEmployees: new FormControl('', notEmptyValidator()),
    useCase: new FormControl('', notEmptyValidator()),
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
    // TODO init name
    this.formInvalid$ = this.form.valueChanges.pipe(
      map(() => this.form.invalid),
      startWith(true)
    );
  }

  public get nameControl(): AbstractControl {
    return this.form.get('name');
  }

  public get industryControl(): AbstractControl {
    return this.form.get('industry');
  }

  public get numEmployeesControl(): AbstractControl {
    return this.form.get('numEmployees');
  }

  public get useCaseControl(): AbstractControl {
    return this.form.get('useCase');
  }

  public onSubmit() {
    const message = `Name: ${this.nameControl.value.trim()}
    Industry: ${this.nameControl.value.trim()}
    Employees: ${this.nameControl.value}
    Use case: ${this.useCaseControl.value.trim()}`;

    this.sendFeedback(message);
  }

  private sendFeedback(message: string) {
    this.performingAction$.next(true);

    this.userService.scheduleDemo(message).subscribe({
      next: () => {
        if (this.configurationService.getConfiguration().analytics) {
          this.angulartics2.eventTrack.next({
            action: 'Demo scheduled',
            properties: {
              category: 'ProductDemo',
            },
          });

          if (this.configurationService.getConfiguration().mixpanelKey) {
            mixpanel.track('Demo scheduled');
          }
        }
        this.notifyOnSuccess();
      },
      error: () => this.notifyOnError(),
    });
  }

  private notifyOnSuccess() {
    const message = $localize`:@@dialog.productDemo.success:We received your request and will get back to you soon.`;
    this.notificationService.success(message);

    this.hideDialog();
  }

  private notifyOnError() {
    const message = $localize`:@@dialog.productDemo.error:Could not schedule product demo.`;
    this.notificationService.error(message);

    this.performingAction$.next(false);
  }

  public hideDialog() {
    this.bsRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
