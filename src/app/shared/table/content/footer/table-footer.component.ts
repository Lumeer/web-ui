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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {ConstraintData} from '@lumeer/data-filters';
import {TableColumnGroup} from '../../model/table-column';
import {TableFooter} from '../../model/table-footer';
import {SelectedTableCell} from '../../model/table-model';

@Component({
  selector: '[table-footer]',
  templateUrl: './table-footer.component.html',
  styleUrls: ['./table-footer.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFooterComponent {
  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public footer: TableFooter;

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public constraintData: ConstraintData;

  public trackByColumn(index: number, column: TableColumnGroup): string {
    return column.id;
  }
}
