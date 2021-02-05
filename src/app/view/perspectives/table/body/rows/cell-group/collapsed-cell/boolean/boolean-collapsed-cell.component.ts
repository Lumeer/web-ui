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
import {BooleanConstraint} from '@lumeer/data-filters';

@Component({
  selector: 'boolean-collapsed-cell',
  templateUrl: './boolean-collapsed-cell.component.html',
  styleUrls: ['./boolean-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanCollapsedCellComponent implements OnChanges {
  @Input()
  public constraint: BooleanConstraint;

  @Input()
  public values: any[];

  public booleanValue: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.values && this.values) {
      this.booleanValue = createBooleanValue(this.values);
    }
  }
}

function createBooleanValue(values: any[]): string {
  if (values.every(value => !!value)) {
    return 'true';
  }

  if (values.every(value => !value)) {
    return 'false';
  }
  return 'indeterminate';
}
