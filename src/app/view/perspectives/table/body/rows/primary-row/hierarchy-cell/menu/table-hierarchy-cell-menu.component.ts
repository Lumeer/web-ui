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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {
  selectTableRowIndentable,
  selectTableRowOutdentable,
} from '../../../../../../../../core/store/tables/tables.selector';
import {isMacOS} from '../../../../../../../../shared/utils/system.utils';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DataResourcePermissions} from '../../../../../../../../core/model/data-resource-permissions';
import {TableDataPermissionsService} from '../../../../../service/table-data-permissions.service';
import {View} from '../../../../../../../../core/store/views/view';

@Component({
  selector: 'table-hierarchy-cell-menu',
  templateUrl: './table-hierarchy-cell-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TableDataPermissionsService],
})
export class TableHierarchyCellMenuComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public view: View;

  @Input()
  public canManageConfig: boolean;

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public contextMenuPosition = {x: 0, y: 0};
  public readonly macOS = isMacOS();

  public indentable$: Observable<boolean>;
  public outdentable$: Observable<boolean>;
  public dataPermissions$: Observable<DataResourcePermissions>;

  constructor(private store$: Store<AppState>, private dataPermissionsService: TableDataPermissionsService) {}

  public open(x: number, y: number) {
    this.contextMenuPosition = {x, y};
    this.contextMenu?.menu.focusFirstItem('mouse');
    this.contextMenu?.openMenu();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.indentable$ = this.store$.select(selectTableRowIndentable(this.cursor));
      this.outdentable$ = this.store$.select(selectTableRowOutdentable(this.cursor));
    }
    if ((changes.cursor || changes.view) && this.cursor) {
      this.dataPermissions$ = this.dataPermissionsService.selectDataPermissions$(this.view, this.cursor);
    }
  }

  public onIndent() {
    this.store$.dispatch(new TablesAction.IndentRow({cursor: this.cursor}));
  }

  public onOutdent() {
    this.store$.dispatch(new TablesAction.OutdentRow({cursor: this.cursor}));
  }
}
