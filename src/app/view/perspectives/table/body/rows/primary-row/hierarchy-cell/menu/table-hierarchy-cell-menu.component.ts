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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ContextMenuComponent} from 'ngx-contextmenu';
import {Observable} from 'rxjs';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {
  selectTableRowIndentable,
  selectTableRowOutdentable,
} from '../../../../../../../../core/store/tables/tables.selector';
import {isMacOS} from 'src/app/shared/utils/system.utils';

@Component({
  selector: 'table-hierarchy-cell-menu',
  templateUrl: './table-hierarchy-cell-menu.component.html',
  styleUrls: ['./table-hierarchy-cell-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHierarchyCellMenuComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @ViewChild(ContextMenuComponent)
  public contextMenu: ContextMenuComponent;

  public readonly macOS = isMacOS();

  public indentable$: Observable<boolean>;
  public outdentable$: Observable<boolean>;

  constructor(private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.indentable$ = this.store$.select(selectTableRowIndentable(this.cursor));
      this.outdentable$ = this.store$.select(selectTableRowOutdentable(this.cursor));
    }
  }

  public onIndent() {
    this.store$.dispatch(new TablesAction.IndentRow({cursor: this.cursor}));
  }

  public onOutdent() {
    this.store$.dispatch(new TablesAction.OutdentRow({cursor: this.cursor}));
  }
}
