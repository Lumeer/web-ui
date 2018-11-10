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

import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {ResizeEvent} from 'angular-resizable-element';
import {AppState} from '../../../../../core/store/app.state';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {
  TableColumn,
  TableColumnType,
  TableCompoundColumn,
  TableModel,
} from '../../../../../core/store/tables/table.model';
import {getTableElement, getTablePart} from '../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {deepArrayEquals} from '../../../../../shared/utils/array.utils';
import {ColumnLayout} from '../../../../../shared/utils/layout/column-layout';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';

@Component({
  selector: 'table-column-group',
  templateUrl: './table-column-group.component.html',
  styleUrls: ['./table-column-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnGroupComponent implements OnChanges, AfterViewChecked {
  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public columns: TableColumn[];

  @Input()
  public collection: CollectionModel;

  @Input()
  public linkType: LinkTypeModel;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public canManageConfig: boolean;

  private columnsLayout: ColumnLayout;
  public columnGroupId: string;

  public resizedColumnIndex: number;

  public containerClassPrefix = 'table-';

  public constructor(private element: ElementRef, private store$: Store<AppState>, private zone: NgZone) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (this.hasColumnsChanged(changes) || this.hasPathChanged(changes) || this.canManageViewChanged(changes)) {
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

  private canManageViewChanged(changes: SimpleChanges): boolean {
    if (!changes.canManageView) {
      return false;
    }
    return changes.canManageView.previousValue !== changes.canManageView.currentValue;
  }

  private refreshLayout() {
    this.destroyLayout();
    this.initLayout();
  }

  private initLayout() {
    this.columnGroupId = this.createColumnGroupId();
    this.columnsLayout = new ColumnLayout(
      '.' + this.layoutContainerClass(),
      {
        layout: {
          horizontal: true,
          rounding: true,
        },
        dragEnabled: this.canManageConfig,
        dragAxis: 'x',
        dragStartPredicate: (item, event) => this.dragStartPredicate(item, event),
      },
      this.zone,
      ({fromIndex, toIndex}) => this.onMoveColumn(fromIndex, toIndex)
    );
  }

  private dragStartPredicate(item, event): boolean {
    if (!event.target.className.includes(`drag-${this.columnGroupId}`)) {
      return false;
    }

    const width = item._width;
    const offset = event.srcEvent.offsetX || event.srcEvent.layerX;
    return 8 < offset && offset < width - 8;
  }

  private layoutContainerClass(): string {
    return this.containerClassPrefix + this.columnGroupId;
  }

  private createColumnGroupId(): string {
    return `${this.table.id}-${this.cursor.partIndex}-${this.cursor.columnPath.join('-')}`;
  }

  private destroyLayout() {
    if (this.columnsLayout) {
      this.columnsLayout.destroy();
    }
  }

  public ngAfterViewChecked() {
    const element = this.element.nativeElement as HTMLElement;
    const height = element.offsetHeight;

    const tableElement = getTableElement(this.cursor.tableId);
    tableElement.style.setProperty('--column-group-height', `${height}px`);
  }

  private onMoveColumn(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    const cursor = {...this.cursor, columnPath: this.cursor.columnPath.concat(fromIndex)};
    this.store$.dispatch(new TablesAction.MoveColumn({cursor, toIndex}));
  }

  public trackByCollectionAndAttribute(index: number, column: TableColumn): string {
    if (column && column.type === TableColumnType.COMPOUND) {
      const part = getTablePart(this.table, this.cursor);
      const {parent} = column as TableCompoundColumn;
      return part.collectionId + ':' + (parent.attributeId || parent.uniqueId);
    }
  }

  public onResizeStart(columnIndex: number, event: ResizeEvent) {
    this.resizedColumnIndex = columnIndex;
  }

  public onResizeEnd(cursor: TableHeaderCursor, event: ResizeEvent): void {
    this.resizedColumnIndex = null;

    const delta = Number(event.edges.right);
    this.store$.dispatch(new TablesAction.ResizeColumn({cursor, delta}));
  }
}
