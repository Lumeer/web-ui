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

import {AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {ResizeEvent} from 'angular-resizable-element';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
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

@Component({
  selector: 'table-column-group',
  templateUrl: './table-column-group.component.html',
  styleUrls: ['./table-column-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnGroupComponent implements AfterViewChecked {
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

  public resizedColumnIndex: number;

  public constructor(private element: ElementRef, private store$: Store<AppState>) {}

  public ngAfterViewChecked() {
    const element = this.element.nativeElement as HTMLElement;
    const height = element.offsetHeight;

    const tableElement = getTableElement(this.cursor.tableId);
    tableElement.style.setProperty('--column-group-height', `${height}px`);
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

  public onDrop(event: any) {
    const {currentIndex, previousIndex} = event;
    if (currentIndex === previousIndex) {
      return;
    }
    const cursor = {...this.cursor, columnPath: this.cursor.columnPath.concat(previousIndex)};
    this.store$.dispatch(new TablesAction.MoveColumn({cursor, toIndex: currentIndex}));
  }
}
