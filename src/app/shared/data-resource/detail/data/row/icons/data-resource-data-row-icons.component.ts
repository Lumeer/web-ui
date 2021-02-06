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
import {DataRow} from '../../../../../data/data-row.service';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {ConstraintType} from '@lumeer/data-filters';

@Component({
  selector: 'data-resource-data-row-icons',
  templateUrl: './data-resource-data-row-icons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDataRowIconsComponent {
  @Input()
  public row: DataRow;

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public attributeTypeClick = new EventEmitter();

  @Output()
  public attributeFunctionClick = new EventEmitter();

  @Output()
  public delete = new EventEmitter();

  public readonly type = ConstraintType;

  public onDelete() {
    this.delete.emit();
  }

  public onAttributeType() {
    this.attributeTypeClick.emit();
  }

  public onAttributeFunction() {
    this.attributeFunctionClick.emit();
  }
}
