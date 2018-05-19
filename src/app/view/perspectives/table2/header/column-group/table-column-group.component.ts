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

import {ChangeDetectionStrategy, Component, Input, NgZone, OnChanges, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../core/store/app.state';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableColumn, TableColumnType, TableCompoundColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {deepArrayEquals} from '../../../../../shared/utils/array.utils';
import {ColumnLayout} from '../../../../../shared/utils/layout/column-layout';

@Component({
  selector: 'table-column-group',
  templateUrl: './table-column-group.component.html',
  styleUrls: ['./table-column-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableColumnGroupComponent implements OnChanges {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public columns: TableColumn[];

  private columnsLayout: ColumnLayout;
  public columnGroupId: string;

  public containerClassPrefix = 'table-';

  public constructor(private store: Store<AppState>,
                     private zone: NgZone) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.hasColumnsChanged(changes) || this.hasPathChanged(changes)) {
      this.refreshLayout();
    }
  }

  private hasPathChanged(changes: SimpleChanges): boolean {
    if (!changes['path']) {
      return false;
    }
    return this.cursor.columnPath && !deepArrayEquals(this.cursor.columnPath, changes['path'].previousValue);
  }

  private hasColumnsChanged(changes: SimpleChanges): boolean {
    if (!changes['columns']) {
      return false;
    }
    return this.columns && !deepArrayEquals(this.columns, changes['columns'].previousValue);
  }

  private refreshLayout() {
    this.destroyLayout();
    this.initLayout();
  }

  private initLayout() {
    this.columnGroupId = this.createColumnGroupId();
    this.columnsLayout = new ColumnLayout('.' + this.layoutContainerClass(), {
      layout: {
        horizontal: true,
        rounding: true
      },
      dragEnabled: true,
      dragAxis: 'x',
      dragStartPredicate: {
        handle: `.${this.dragClass()}`
      }
    }, this.zone, ({fromIndex, toIndex}) => this.onMoveColumn(fromIndex, toIndex));
  }

  private layoutContainerClass(): string {
    return this.containerClassPrefix + this.columnGroupId;
  }

  private dragClass(): string {
    return `drag-${this.columnGroupId}`;
  }

  private createColumnGroupId(): string {
    return `${this.table.id}-${this.cursor.partIndex}-${this.cursor.columnPath.join('-')}`;
  }

  private destroyLayout() {
    if (this.columnsLayout) {
      this.columnsLayout.destroy();
    }
  }

  private onMoveColumn(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    const cursor = {...this.cursor, columnPath: this.cursor.columnPath.concat(fromIndex)};
    this.store.dispatch(new TablesAction.MoveColumn({cursor, toIndex}));
  }

  public trackByCollectionAndAttribute(index: number, column: TableColumn): string {
    if (column && column.type === TableColumnType.COMPOUND) {
      const part = this.table.parts[this.cursor.partIndex];
      return part.collectionId + ':' + (column as TableCompoundColumn).parent.attributeId;
    }
  }

}
