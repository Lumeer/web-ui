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
import {FormGroup} from '@angular/forms';
import {ConstraintConfig, ConstraintType} from '../../../../core/model/data/constraint';
import {removeAllFormControls} from '../../../../shared/utils/form.utils';

@Component({
  selector: 'constraint-config-form',
  templateUrl: './constraint-config-form.component.html',
  styleUrls: ['./constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: ConstraintConfig;

  @Input()
  public form: FormGroup;

  @Input()
  public type: ConstraintType;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.type) {
      removeAllFormControls(this.form);
    }
  }
}
