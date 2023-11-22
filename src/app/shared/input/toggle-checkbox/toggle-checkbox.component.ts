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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {generateId} from '../../utils/resource.utils';

@Component({
  selector: 'toggle-checkbox',
  templateUrl: './toggle-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCheckboxComponent {
  @Input()
  public checked: boolean;

  @Input()
  public label: string;

  @Input()
  public disabled: boolean;

  @Input()
  public icon: string;

  @Input()
  public hint: string;

  @Output()
  public checkedChange = new EventEmitter<boolean>();

  public id = generateId();
}
