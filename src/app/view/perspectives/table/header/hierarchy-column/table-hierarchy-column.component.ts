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
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {selectTableHierarchyMaxLevel} from '../../../../../core/store/tables/tables.selector';

@Component({
  selector: 'table-hierarchy-column',
  templateUrl: './table-hierarchy-column.component.html',
  styleUrls: ['./table-hierarchy-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHierarchyColumnComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  public spaces$: Observable<any[]>;

  public constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.cursor && this.cursor) {
      this.bindHierarchyMaxLevel(this.cursor);
    }
  }

  private bindHierarchyMaxLevel(cursor: TableBodyCursor) {
    this.spaces$ = this.store$.pipe(
      select(selectTableHierarchyMaxLevel(cursor.tableId)),
      map(maxLevel => maxLevel && new Array(maxLevel + 1))
    );
  }
}
