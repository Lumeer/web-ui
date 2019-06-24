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

import {ChangeDetectionStrategy, Component, Input, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {CoordinatesConstraintConfig, CoordinatesFormat} from '../../../../../core/model/data/constraint-config';
import {removeAllFormControls} from '../../../../../shared/utils/form.utils';
import {CoordinatesConstraintFormControl} from './coordinates-constraint-form-control';

const NUMBER_KEYS = Array.from(new Array(10).keys()).map(key => String(key));

@Component({
  selector: 'coordinates-constraint-config-form',
  templateUrl: './coordinates-constraint-config-form.component.html',
  styleUrls: ['./coordinates-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatesConstraintConfigFormComponent {
  public readonly controls = CoordinatesConstraintFormControl;
  public readonly formats = Object.values(CoordinatesFormat);

  @Input()
  public config: CoordinatesConstraintConfig;

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
      CoordinatesConstraintFormControl.Format,
      new FormControl((this.config && this.config.format) || CoordinatesFormat.DecimalDegrees)
    );
    this.form.addControl(
      CoordinatesConstraintFormControl.Precision,
      new FormControl(this.config ? this.config.precision : getDefaultPrecision(this.config && this.config.format), [
        Validators.required,
        Validators.pattern(/^-?[0-9]*$/),
        Validators.min(0),
        Validators.max(10),
      ])
    );
  }

  public onFormatChange() {
    if (!this.config) {
      this.precisionControl.setValue(getDefaultPrecision(this.formatControl.value));
    }
  }

  public get formatControl(): AbstractControl {
    return this.form.get(CoordinatesConstraintFormControl.Format);
  }

  public get precisionControl(): AbstractControl {
    return this.form.get(CoordinatesConstraintFormControl.Precision);
  }
}

function getDefaultPrecision(format: CoordinatesFormat): number {
  return format === CoordinatesFormat.DegreesMinutesSeconds ? 3 : 6;
}
