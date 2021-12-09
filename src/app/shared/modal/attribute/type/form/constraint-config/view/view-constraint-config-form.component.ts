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
import {ViewConstraintFormControl} from './view-constraint-form-control';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {ViewConstraintConfig} from '@lumeer/data-filters';

@Component({
  selector: 'view-constraint-config-form',
  templateUrl: './view-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: ViewConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly formControlName = ViewConstraintFormControl;

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
    this.form.addControl(ViewConstraintFormControl.Multi, new FormControl(this.config?.multi));
    this.form.addControl(ViewConstraintFormControl.OpenInNewWindow, new FormControl(this.config?.openInNewWindow));
  }
}
