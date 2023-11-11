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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../../core/store/tables/table-cursor';
import {calculateColumnsWidth} from '../../../../../../core/store/tables/table.utils';
import {selectTableParts} from '../../../../../../core/store/tables/tables.selector';
import {selectReadableCollectionsByView} from '../../../../../../core/store/common/permissions.selectors';
import {AppState} from '../../../../../../core/store/app.state';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'table-empty-row',
  templateUrl: './table-empty-row.component.html',
  styleUrls: ['./table-empty-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableEmptyRowComponent implements OnChanges {
  @Input()
  public canManageConfig: boolean;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public view: View;

  public hasCollectionToLink$: Observable<boolean>;
  public dataColumnsWidth$: Observable<number>;
  public linkInfoCells$: Observable<any[]>;

  constructor(
    private element: ElementRef<HTMLElement>,
    private store$: Store<AppState>
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.canManageConfig || changes.cursor) && this.cursor) {
      this.dataColumnsWidth$ = this.bindDataColumnsWidth();
      this.linkInfoCells$ = this.bindLinkInfoCells();
    }
    if (changes.currentView) {
      this.hasCollectionToLink$ = this.store$.pipe(
        select(selectReadableCollectionsByView(this.view)),
        map(collections => collections.length > 1)
      );
    }
  }

  private bindDataColumnsWidth(): Observable<number> {
    return this.store$.pipe(
      select(selectTableParts(this.cursor)),
      map(
        parts =>
          parts &&
          parts.reduce((width, part) => width + calculateColumnsWidth(part.columns, this.canManageConfig), 0) - 1
      )
    );
  }

  private bindLinkInfoCells(): Observable<any[]> {
    return this.store$.pipe(
      select(selectTableParts(this.cursor)),
      map(parts => (parts ? Math.floor(parts.length / 2) : 0)),
      map(count => new Array(count))
    );
  }
}
