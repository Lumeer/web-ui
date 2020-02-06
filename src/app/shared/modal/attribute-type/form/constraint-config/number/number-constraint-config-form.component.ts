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
import {FormControl, FormGroup} from '@angular/forms';
import {NumberConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {minMaxValidator} from '../../../../../../core/validators/min-max-validator';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {NumberConstraintFormControl} from './number-constraint-form-control';
import {NumberDataValue} from '../../../../../../core/model/data-value/number.data-value';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {NumberConstraint} from '../../../../../../core/model/constraint/number.constraint';

@Component({
  selector: 'number-constraint-config-form',
  templateUrl: './number-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: NumberConstraintConfig;

  @Input()
  public form: FormGroup;

  public exampleValue$: Observable<NumberDataValue>;

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
    this.form.addControl(NumberConstraintFormControl.Decimals, new FormControl(this.config && this.config.decimals));
    this.form.addControl(NumberConstraintFormControl.Compact, new FormControl(this.config && this.config.compact));
    this.form.addControl(NumberConstraintFormControl.ForceSign, new FormControl(this.config && this.config.forceSign));
    this.form.addControl(NumberConstraintFormControl.Separated, new FormControl(this.config && this.config.separated));
    this.form.addControl(NumberConstraintFormControl.Negative, new FormControl(this.config && this.config.negative));
    this.form.addControl(
      NumberConstraintFormControl.MinValue,
      new FormControl(this.config && this.config.minValue && this.config.minValue.toFixed())
    );
    this.form.addControl(
      NumberConstraintFormControl.MaxValue,
      new FormControl(this.config && this.config.maxValue && this.config.maxValue.toFixed())
    );
    this.form.setValidators(
      minMaxValidator(NumberConstraintFormControl.MinValue, NumberConstraintFormControl.MaxValue)
    );

    this.exampleValue$ = this.form.valueChanges.pipe(
      startWith(''),
      map(() => this.createNumberDataValue())
    );
  }

  private createNumberDataValue(): NumberDataValue {
    const config: NumberConstraintConfig = this.form.value;
    let exampleValue = 123456789.123456789;
    if (config.negative) {
      exampleValue *= -1;
    }

    return new NumberConstraint(config).createDataValue(exampleValue);
  }
}
