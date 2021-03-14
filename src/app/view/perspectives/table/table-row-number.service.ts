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

import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';
import {selectTableRows} from '../../../core/store/tables/tables.selector';
import {countLinkedRows} from '../../../core/store/tables/table.utils';
import {TableConfigRow} from '../../../core/store/tables/table.model';
import {AppState} from '../../../core/store/app.state';

const COMPUTE_BATCH = 100;

/**
 * Optimizes table row number calculation by caching previous results and using them when calculating next row numbers.
 */
@Injectable()
export class TableRowNumberService {
  private subject$ = new BehaviorSubject<number[]>([]);
  private observable$: Observable<number[]> = this.subject$.asObservable();
  private rowsSubscription = new Subscription();
  private rowsComputed = COMPUTE_BATCH;
  private rows: TableConfigRow[] = [];

  private lastTableId: string;

  constructor(private store$: Store<AppState>) {}

  public setTableId(tableId: string) {
    if (this.lastTableId !== tableId) {
      this.rowsComputed = COMPUTE_BATCH;
      this.rowsSubscription.unsubscribe();
      this.rowsSubscription = this.store$.pipe(select(selectTableRows(tableId)), debounceTime(50)).subscribe(rows => {
        this.rows = rows;
        this.computeRowsCount(0, this.rowsComputed);
      });
    }
  }

  private computeRowsCount(fromIndex: number, toIndex: number) {
    if (this.rows.length === 0) {
      return;
    }
    const counts = [...this.subject$.value];
    for (let i = fromIndex; i < toIndex; i++) {
      const row = this.rows[i - 1];
      if (row) {
        counts[i] = countLinkedRows(row) + (counts[i - 1] || 0);
      } else {
        counts[i] = 1;
      }
    }
    this.subject$.next(counts);
  }

  public observeRowNumber(rowIndex: number): Observable<number> {
    if (rowIndex >= this.rowsComputed) {
      const previousComputed = this.rowsComputed;
      const computeToIndex = rowIndex + COMPUTE_BATCH;
      this.computeRowsCount(previousComputed, computeToIndex);
      this.rowsComputed = computeToIndex;
    }
    return this.observable$.pipe(map(array => array[rowIndex] || 0));
  }
}
