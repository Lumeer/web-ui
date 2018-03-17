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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {Edges, ResizeEvent} from 'angular-resizable-element';
import {AppState} from '../../../../../../core/store/app.state';
import {TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableCompoundColumn, TableModel, TablePart} from '../../../../../../core/store/tables/table.model';
import {calculateColumnRowspan, getTableColumnWidth, hasLastTableColumnChildHidden, hasTableColumnChildren, isLastTableColumnChild} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';
import {getLastFromArray} from '../../../../../../shared/utils/array.utils';
import {TABLE_ROW_HEIGHT} from '../table-column-group.component';

const MIN_COLUMN_WIDTH = 20;

@Component({
  selector: 'table-compound-column',
  templateUrl: './table-compound-column.component.html',
  styleUrls: ['./table-compound-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCompoundColumnComponent {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public column: TableCompoundColumn;

  public constructor(private store: Store<AppState>) {
  }

  public height(): string {
    if (this.column.children.length) {
      return `${TABLE_ROW_HEIGHT}px`;
    }

    const rowspan = calculateColumnRowspan(this.table, this.cursor.partIndex, this.cursor.columnPath.slice(0, this.cursor.columnPath.length - 1));
    const height = rowspan * TABLE_ROW_HEIGHT;
    return `${height}px`;
  }

  public width(): string {
    const width = getTableColumnWidth(this.column);
    return `${width}px`;
  }

  public onResizeEnd(event: ResizeEvent): void {
    const delta = Number(event.edges.right);
    this.resizeColumn(delta);
  }

  private resizeColumn(delta: number) {
    this.store.dispatch(new TablesAction.ResizeColumn({cursor: this.cursor, delta}));
  }

  public validateResize(event: ResizeEvent) {
    if (!hasTableColumnChildren(this.column)) {
      return event.rectangle.width >= MIN_COLUMN_WIDTH;
    }

    const lastChild = getLastFromArray(this.column.children);
    const lastChildWidth = getTableColumnWidth(lastChild);
    const delta = Number(event.edges.right);
    return lastChildWidth + delta >= MIN_COLUMN_WIDTH;
  }

  public resizeEdges(): Edges {
    const isLastChild = isLastTableColumnChild(this.getPart().columns, this.cursor.columnPath);
    const hasLastChildHidden = hasLastTableColumnChildHidden(this.column);

    return isLastChild || hasLastChildHidden ? {} : {right: true};
  }

  private getPart(): TablePart {
    return this.table.parts[this.cursor.partIndex];
  }

}
