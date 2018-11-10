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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigRow, TablePart} from '../../../../../../../core/store/tables/table.model';
import {isTableRowStriped} from '../../../../../../../core/store/tables/table.utils';
import {selectHasNextTableParts, selectTablePart} from '../../../../../../../core/store/tables/tables.selector';

@Component({
  selector: 'table-linked-row',
  templateUrl: './table-linked-row.component.html',
  styleUrls: ['./table-linked-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.bg-light]': 'striped',
    '[class.bg-white]': '!striped',
  },
})
export class TableLinkedRowComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public rows: TableConfigRow[];

  @Input()
  public canManageConfig: boolean;

  public linkInstancePart$: Observable<TablePart>;
  public documentPart$: Observable<TablePart>;

  public hasNextParts$: Observable<boolean>;

  public striped: boolean;

  constructor(private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.bindTableParts(this.cursor);
      this.striped = isTableRowStriped(this.cursor.rowPath);
    }
  }

  private bindTableParts(cursor: TableBodyCursor) {
    this.linkInstancePart$ = this.store$.pipe(select(selectTablePart(cursor)));

    const documentPartCursor = {...cursor, partIndex: cursor.partIndex + 1};
    this.documentPart$ = this.store$.pipe(select(selectTablePart(documentPartCursor)));

    this.hasNextParts$ = this.store$.pipe(select(selectHasNextTableParts(documentPartCursor)));
  }
}
