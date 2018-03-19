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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {LinkTypeModel} from '../../../../../../core/store/link-types/link-type.model';

@Component({
  selector: 'table-link-info',
  templateUrl: './table-link-info.component.html',
  styleUrls: ['./table-link-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableLinkInfoComponent {

  @Input()
  public linkType: LinkTypeModel;

  @Input()
  public switchingEnabled: boolean;

  @Output()
  public switchParts = new EventEmitter();

  @Output()
  public removePart = new EventEmitter();

  public colors(): string[] {
    return this.linkType.collections.map(collection => collection.color);
  }

  public icons(): string[] {
    return this.linkType.collections.map(collection => collection.icon);
  }

}
