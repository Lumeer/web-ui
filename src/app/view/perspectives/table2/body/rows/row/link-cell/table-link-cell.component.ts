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

import {Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../../core/store/app.state';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableModel, TableRow} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-link-cell',
  templateUrl: './table-link-cell.component.html',
  styleUrls: ['./table-link-cell.component.scss']
})
export class TableLinkCellComponent {

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableRow;

  @Input()
  public striped: boolean;

  @Input()
  public table: TableModel;

  public constructor(private store: Store<AppState>) {
  }

  public collapsible(): boolean {
    return this.row.linkedRows && this.row.linkedRows.length > 1;
  }

  public expendable(): boolean {
    if (!this.row.linkedRows || this.row.linkedRows.length !== 1) {
      return false;
    }
    const [row] = this.row.linkedRows;
    return (row.documentIds && row.documentIds.length > 1) || (row.linkInstanceIds && row.linkInstanceIds.length > 1);
  }

  public onExpand() {
    this.store.dispatch(new TablesAction.ExpandRows({cursor: this.cursor}));
  }

  public onCollapse() {
    this.store.dispatch(new TablesAction.CollapseRows({cursor: this.cursor}));
  }

  public width(): string {
    return `30px`;
  }

}
