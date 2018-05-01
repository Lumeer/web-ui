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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {LinkInstanceModel} from '../../../../../../../../core/store/link-instances/link-instance.model';
import {areTableBodyCursorsEqual, TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TableColumn, TableColumnType, TableModel} from '../../../../../../../../core/store/tables/table.model';
import {getTableColumnWidth} from '../../../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../../../../core/store/tables/tables.state';
import {Direction} from '../../../../../../../../shared/direction';
import {KeyCode} from '../../../../../../../../shared/key-code';

@Component({
  selector: 'table-cell',
  templateUrl: './table-cell.component.html'
})
export class TableCellComponent implements OnInit, OnDestroy {

  @Input()
  public column: TableColumn;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstanceModel[];

  @Input()
  public table: TableModel;

  public selected: boolean;

  private subscriptions = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToSelectedCursor();
  }

  private subscribeToSelectedCursor() {
    this.subscriptions.add(
      this.store.select(selectTableCursor)
        .subscribe(cursor => this.selected = areTableBodyCursorsEqual(this.cursor, cursor))
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public isSingleColumn(): boolean {
    return this.column.type === TableColumnType.SINGLE;
  }

  public isCollapsed(): boolean {
    return (this.documents && this.documents.length > 1) || (this.linkInstances && this.linkInstances.length > 1);
  }

  public width(): string {
    const width = getTableColumnWidth(this.column);
    return `${width}px`;
  }

  public onMouseDown() {
    if (!this.selected) {
      this.store.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.LeftArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Left}));
      case KeyCode.UpArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Up}));
      case KeyCode.RightArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Right}));
      case KeyCode.DownArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Down}));
    }
  }

}
