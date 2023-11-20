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
import {AbstractControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {DialogType} from '../dialog-type';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {UsersAction} from '../../../core/store/users/users.action';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';

@Component({
  selector: 'get-in-touch-modal',
  templateUrl: './get-in-touch-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetInTouchModalComponent implements OnInit {
  public readonly form = new UntypedFormGroup({
    message: new UntypedFormControl('', Validators.required),
  });

  public readonly dialogType = DialogType;

  public formInvalid$: Observable<boolean>;
  public performingAction$ = new BehaviorSubject(false);

  public constructor(
    private bsRef: BsModalRef,
    private store$: Store<AppState>
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

    this.store$.dispatch(
      new UsersAction.GetInTouch({
        message,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.onError(),
      })
    );
  }

  private onError() {
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
