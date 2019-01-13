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
import {CaseStyle, TextConstraintConfig} from '../../../../../core/model/data/constraint';
import {removeAllFormControls} from '../../../../../shared/utils/form.utils';
import {minMaxValidator} from '../../../../../core/validators/validators';

@Component({
  selector: 'text-constraint-config-form',
  templateUrl: './text-constraint-config-form.component.html',
  styleUrls: ['./text-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: TextConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly caseStyles = Object.keys(CaseStyle);

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
    const caseStyle = (this.config && this.config.caseStyle) || CaseStyle.None;
    this.form.addControl('caseStyle', new FormControl(caseStyle));

    this.form.addControl('minLength', new FormControl(this.config && this.config.minLength));
    this.form.addControl('maxLength', new FormControl(this.config && this.config.maxLength));

    this.form.setValidators(minMaxValidator('minLength', 'maxLength'));
  }
}
