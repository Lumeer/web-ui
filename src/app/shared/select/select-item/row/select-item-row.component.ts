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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {SelectItem2Model} from '../../select-item2/select-item2.model';
import {preventEvent} from '../../../utils/common.utils';

@Component({
  selector: 'select-item-row',
  templateUrl: './select-item-row.component.html',
  styleUrls: ['./select-item-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectItemRowComponent {

  @Input()
  public item: SelectItem2Model;

  @Input()
  public removable: boolean;

  @Input()
  public disabled: boolean;

  @Output()
  public remove = new EventEmitter();

  public onRemove(event: any) {
    preventEvent(event);
    this.remove.emit();
  }

}
