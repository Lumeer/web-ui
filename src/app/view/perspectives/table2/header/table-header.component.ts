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

import {ChangeDetectionStrategy, Component, Input, SimpleChange, SimpleChanges} from '@angular/core';
import {TableHeaderCursor} from '../../../../core/store/tables/table-cursor';
import {TableModel, TablePart} from '../../../../core/store/tables/table.model';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableHeaderComponent {

  @Input()
  public table: TableModel;

  public cursor: TableHeaderCursor;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.table && this.table && hasTableIdChanged(changes.table)) {
      this.cursor = this.createHeaderRootCursor();
    }
  }

  private createHeaderRootCursor(): TableHeaderCursor {
    return {
      tableId: this.table.id,
      partIndex: null,
      columnPath: []
    };
  }

  public trackByPartIndex(index: number, part: TablePart): number {
    return part.index;
  }

}

function hasTableIdChanged(change: SimpleChange): boolean {
  return !change.previousValue || change.previousValue.id !== change.currentValue.id;
}
