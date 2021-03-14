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

import {Pipe, PipeTransform} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {selectTableById} from '../../../../../core/store/tables/tables.selector';
import {isTableRowCollapsed} from '../../../../../core/store/tables/utils/table-row-collapsing.utils';
import {AppState} from '../../../../../core/store/app.state';

/**
 * Checks if the linked row from the previous table part has collapsed next linked rows (current cell is collapsed).
 */
@Pipe({
  name: 'cellCollapsed',
})
export class CellCollapsedPipe implements PipeTransform {
  constructor(private store$: Store<AppState>) {}

  public transform(cursor: TableBodyCursor): Observable<boolean> {
    return this.store$.pipe(
      select(selectTableById(cursor.tableId)),
      map(table =>
        Boolean(table && table.config && isTableRowCollapsed(table.config.rows, cursor.rowPath.slice(0, -1)))
      ),
      distinctUntilChanged()
    );
  }
}
