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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableConfigRow} from '../../../../../../../core/store/tables/table.model';
import {
  selectHasNextTableParts,
  selectTablePart,
  selectTableRowStriped,
} from '../../../../../../../core/store/tables/tables.selector';
import {filter, switchMap} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';

@Component({
  selector: 'table-linked-row',
  templateUrl: './table-linked-row.component.html',
  styleUrls: ['./table-linked-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.table-bg-light]': 'striped',
    '[class.table-bg-white]': '!striped',
  },
})
export class TableLinkedRowComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public rows: TableConfigRow[];

  @Input()
  public canManageConfig: boolean;

  public linkInstancePart$: Observable<TableConfigPart>;
  public documentPart$: Observable<TableConfigPart>;

  public hasNextParts$: Observable<boolean>;

  public striped: boolean;

  private cursor$ = new BehaviorSubject<TableBodyCursor>(null);

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.cursor$
        .pipe(
          filter(cursor => !!cursor),
          switchMap(cursor => this.store$.pipe(select(selectTableRowStriped(cursor))))
        )
        .subscribe(striped => (this.striped = striped)) // change made just before change detector updates view
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.bindTableParts(this.cursor);
      this.cursor$.next(this.cursor);
    }
  }

  private bindTableParts(cursor: TableBodyCursor) {
    this.linkInstancePart$ = this.store$.pipe(select(selectTablePart(cursor)));

    const documentPartCursor = {...cursor, partIndex: cursor.partIndex + 1};
    this.documentPart$ = this.store$.pipe(select(selectTablePart(documentPartCursor)));

    this.hasNextParts$ = this.store$.pipe(select(selectHasNextTableParts(documentPartCursor)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
