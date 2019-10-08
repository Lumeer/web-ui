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
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {PercentageConstraintConfig} from '../../../../../core/model/data/constraint-config';
import {minMaxValidator} from '../../../../../core/validators/min-max-validator';
import {removeAllFormControls} from '../../../../../shared/utils/form.utils';
import {PercentageConstraintFormControl} from './percentage-constraint-form-control';

@Component({
  selector: 'percentage-constraint-config-form',
  templateUrl: './percentage-constraint-config-form.component.html',
  styleUrls: ['./percentage-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentageConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: PercentageConstraintConfig;

  @Input()
  public form: FormGroup;

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
    this.form.addControl(
      PercentageConstraintFormControl.Decimals,
      new FormControl(this.config && this.config.decimals, Validators.min(0))
    );
    this.form.addControl(
      PercentageConstraintFormControl.MinValue,
      new FormControl(this.config && this.config.minValue)
    );
    this.form.addControl(
      PercentageConstraintFormControl.MaxValue,
      new FormControl(this.config && this.config.maxValue)
    );
    this.form.setValidators(
      minMaxValidator(PercentageConstraintFormControl.MinValue, PercentageConstraintFormControl.MaxValue)
    );
  }

  public get decimalsControl(): AbstractControl {
    return this.form.get(PercentageConstraintFormControl.Decimals);
  }
}
