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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: 'view-settings-modal-body',
  templateUrl: './view-settings-modal-body.component.html',
  styleUrls: ['./view-settings-modal-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSettingsModalBodyComponent {
  @Input()
  public form: FormGroup;

  @Input()
  public views: View[];

  @Output()
  public delete = new EventEmitter();

  public readonly minInteger = Number.MIN_SAFE_INTEGER;
  public readonly maxInteger = Number.MAX_SAFE_INTEGER;

  public get nameControl(): AbstractControl {
    return this.form.controls.name;
  }

  public get priorityControl(): AbstractControl {
    return this.form.controls.priority;
  }

  public get iconControl(): AbstractControl {
    return this.form.controls.icon;
  }

  public get colorControl(): AbstractControl {
    return this.form.controls.color;
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.iconControl.patchValue(data.icon);
    this.colorControl.patchValue(data.color);
  }
}
