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
import {ChangeDetectionStrategy, Component, HostListener, OnInit} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, startWith, take} from 'rxjs/operators';

import {AppState} from '../../../core/store/app.state';
import {UsersAction} from '../../../core/store/users/users.action';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {notEmptyValidator} from '../../../core/validators/custom-validators';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {DialogType} from '../dialog-type';

@Component({
  selector: 'book-product-demo-modal',
  templateUrl: './book-product-demo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookProductDemoModalComponent implements OnInit {
  public readonly form = new UntypedFormGroup({
    name: new UntypedFormControl('', notEmptyValidator()),
    industry: new UntypedFormControl('', notEmptyValidator()),
    numEmployees: new UntypedFormControl('', notEmptyValidator()),
    useCase: new UntypedFormControl('', notEmptyValidator()),
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

    this.store$
      .pipe(select(selectCurrentUser), take(1))
      .subscribe(currentUser => this.nameControl.setValue(currentUser?.name));
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

    this.store$.dispatch(
      new UsersAction.BookProductDemo({
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
