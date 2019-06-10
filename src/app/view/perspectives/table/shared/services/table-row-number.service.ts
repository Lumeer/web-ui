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
import {combineLatest, Observable, of} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {selectTableLinkedRowsCount} from '../../../../../core/store/tables/tables.selector';

/**
 * Optimizes table row number calculation by caching previous results and using them when calculating next row numbers.
 */
@Injectable()
export class TableRowNumberService {
  private observables = new Map<number, Observable<number>>();

  constructor(private store$: Store<{}>) {}

  public observeRowNumber(tableId: string, rowIndex: number): Observable<number> {
    if (this.observables.has(rowIndex)) {
      return this.observables.get(rowIndex);
    }

    const observable = this.createRowObservable(tableId, rowIndex);
    this.observables.set(rowIndex, observable);
    return observable;
  }

  private createRowObservable(tableId: string, rowIndex: number): Observable<number> {
    if (rowIndex <= 0) {
      return of(1);
    }

    const previousCursor: TableBodyCursor = {
      tableId,
      partIndex: 0,
      rowPath: [rowIndex - 1],
    };
    return combineLatest(
      this.observeRowNumber(tableId, rowIndex - 1),
      this.store$.pipe(
        select(selectTableLinkedRowsCount(previousCursor)),
        distinctUntilChanged()
      )
    ).pipe(
      map(([previousRowNumber, previousLinkedRowsCount]) => previousRowNumber + previousLinkedRowsCount),
      distinctUntilChanged()
    );
  }
}
