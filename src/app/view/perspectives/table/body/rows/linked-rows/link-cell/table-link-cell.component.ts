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
import {TableConfigRow} from '../../../../../../../core/store/tables/table.model';

@Component({
  selector: 'table-link-cell',
  templateUrl: './table-link-cell.component.html',
  styleUrls: ['./table-link-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLinkCellComponent {
  @Input()
  public row: TableConfigRow;

  @Input()
  public striped: boolean;

  @Output()
  public toggle = new EventEmitter();
}
