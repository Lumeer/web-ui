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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {LinkConstraint, LinkDataValue} from '@lumeer/data-filters';

@Component({
  selector: 'link-collapsed-cell',
  templateUrl: './link-collapsed-cell.component.html',
  styleUrls: ['./link-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkCollapsedCellComponent implements OnChanges {
  @Input()
  public constraint: LinkConstraint;

  @Input()
  public values: any[];

  public dataValues: LinkDataValue[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.values || changes.constraint) && this.constraint) {
      this.dataValues = (this.values || [])
        .filter(value => !!value)
        .map(value => this.constraint?.createDataValue(value));
    }
  }
}
