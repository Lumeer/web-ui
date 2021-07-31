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

import {FormControl, FormGroup} from '@angular/forms';
import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {ActionConstraintFormControl} from '../action-constraint-form-control';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {actionConstraintConfirmationPlaceholder} from '../action-constraint.utils';

@Component({
  selector: 'action-constraint-confirmation-form',
  templateUrl: './action-constraint-confirmation-form.component.html',
  styleUrls: ['./action-constraint-confirmation-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConfirmationFormComponent implements OnInit {
  @Input()
  public form: FormGroup;

  public readonly formControlName = ActionConstraintFormControl;

  public placeholder$: Observable<string>;

  public get requiresConfirmationControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.RequiresConfirmation];
  }

  public get confirmationTitleControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.ConfirmationTitle];
  }

  public get titleUserControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.Title];
  }

  public ngOnInit() {
    this.placeholder$ = this.observePlaceholder$();
  }

  private observePlaceholder$(): Observable<string> {
    return this.titleUserControl.valueChanges.pipe(
      startWith(''),
      map(() => actionConstraintConfirmationPlaceholder(this.titleUserControl.value))
    );
  }
}
