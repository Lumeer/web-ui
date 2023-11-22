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
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {LinkConstraintConfig} from '@lumeer/data-filters';

import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {LinkConstraintFormControl} from './link-constraint-form-control';

@Component({
  selector: 'link-constraint-config-form',
  templateUrl: './link-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: LinkConstraintConfig;

  @Input()
  public form: UntypedFormGroup;

  public readonly formControlName = LinkConstraintFormControl;

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
    this.form.addControl(LinkConstraintFormControl.OpenInApp, new UntypedFormControl(this.config?.openInApp));
  }
}
