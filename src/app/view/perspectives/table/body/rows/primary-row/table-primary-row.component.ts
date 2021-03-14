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

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableConfigRow} from '../../../../../../core/store/tables/table.model';
import {isTableRowStriped} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';
import {
  selectHasNextTableParts,
  selectTableHierarchyMaxLevel,
  selectTablePart,
  selectTableRowWithHierarchyLevel,
} from '../../../../../../core/store/tables/tables.selector';
import {selectCollectionsByReadPermission} from '../../../../../../core/store/common/permissions.selectors';
import {AppState} from '../../../../../../core/store/app.state';

@Component({
  selector: 'table-primary-row',
  templateUrl: './table-primary-row.component.html',
  styleUrls: ['./table-primary-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.table-bg-light]': 'striped',
    '[class.table-bg-white]': '!striped',
  },
})
export class TablePrimaryRowComponent implements OnInit, OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableConfigRow;

  @Input()
  public canManageConfig: boolean;

  @Output()
  public unsetCursor = new EventEmitter();

  public hasNextParts$: Observable<boolean>;
  public hierarchyLevel$: Observable<number>;
  public hierarchyMaxLevel$: Observable<number>;
  public striped: boolean;
  public part$: Observable<TableConfigPart>;
  public hasCollectionToLink$: Observable<boolean>;

  constructor(private element: ElementRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindCollectionHasToLink();
  }

  private bindCollectionHasToLink() {
    this.hasCollectionToLink$ = this.store$.pipe(
      select(selectCollectionsByReadPermission),
      map(collections => collections.length > 1)
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.striped = isTableRowStriped([], this.cursor.rowPath);
      this.hasNextParts$ = this.store$.pipe(select(selectHasNextTableParts(this.cursor)));
      this.part$ = this.store$.pipe(select(selectTablePart(this.cursor)));
      this.bindHierarchy(this.cursor);
    }
  }

  private bindHierarchy(cursor: TableBodyCursor) {
    this.hierarchyMaxLevel$ = this.store$.pipe(
      select(selectTableHierarchyMaxLevel(cursor.tableId)),
      distinctUntilChanged()
    );
    this.hierarchyLevel$ = this.store$.pipe(
      select(selectTableRowWithHierarchyLevel(cursor)),
      map(row => row && row.level),
      distinctUntilChanged()
    );
  }

  public onHierarchyToggle() {
    this.store$.dispatch(new TablesAction.ToggleChildRows({cursor: this.cursor}));
  }
}
