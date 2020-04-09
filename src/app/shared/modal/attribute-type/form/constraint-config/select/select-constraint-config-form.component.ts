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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {SelectConstraintFormControl, SelectConstraintOptionsFormControl} from './select-constraint-form-control';
import {SelectConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {uniqueValuesValidator} from '../../../../../../core/validators/unique-values-validator';
import {minimumValuesCountValidator} from '../../../../../../core/validators/mininum-values-count-validator';

@Component({
  selector: 'select-constraint-config-form',
  templateUrl: './select-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: SelectConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly formControlName = SelectConstraintFormControl;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.addMultiFormControl();
    this.addDisplayValuesFormControl();
    this.addOptionsFormArray();
  }

  private addMultiFormControl() {
    this.form.addControl(SelectConstraintFormControl.Multi, new FormControl(this.config?.multi));
  }

  private addDisplayValuesFormControl() {
    this.form.addControl(SelectConstraintFormControl.DisplayValues, new FormControl(this.config?.displayValues));
  }

  private addOptionsFormArray() {
    this.form.addControl(
      SelectConstraintFormControl.Options,
      new FormArray(
        [],
        [
          uniqueValuesValidator(SelectConstraintOptionsFormControl.Value, true),
          minimumValuesCountValidator(SelectConstraintOptionsFormControl.Value, 1),
        ]
      )
    );
  }

  public get displayValuesControl(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.DisplayValues);
  }

  public get optionsForm(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.Options);
  }
}
