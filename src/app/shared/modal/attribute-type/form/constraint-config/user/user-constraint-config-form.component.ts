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
import {UserConstraintFormControl} from './user-constraint-form-control';
import {UserConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {removeAllFormControls} from '../../../../../utils/form.utils';

@Component({
  selector: 'user-constraint-config-form',
  templateUrl: './user-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: UserConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly formControlName = UserConstraintFormControl;

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
      UserConstraintFormControl.ExternalUsers,
      new FormControl(this.config && this.config.externalUsers)
    );
  }
}
