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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {NumberConstraintConfig} from '../../../../../core/model/data/constraint';
import {removeAllFormControls} from '../../../../../shared/utils/form.utils';
import {minMaxValidator} from '../../../../../core/validators/validators';

@Component({
  selector: 'number-constraint-config-form',
  templateUrl: './number-constraint-config-form.component.html',
  styleUrls: ['./number-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: NumberConstraintConfig;

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
    this.form.addControl('minValue', new FormControl(this.config && this.config.minValue));
    this.form.addControl('maxValue', new FormControl(this.config && this.config.maxValue));
    this.form.setValidators(minMaxValidator('minValue', 'maxValue'));
  }
}
