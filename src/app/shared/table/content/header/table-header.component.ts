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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {TableColumn, TableColumnGroup} from '../../model/table-column';
import {LinksListHeaderMenuComponent} from '../../../links/links-list/table/header/menu/links-list-header-menu.component';
import {CdkDragDrop, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject} from 'rxjs';
import {EditedTableCell, SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType} from '../../model/table-model';
import {AttributeSortType} from '../../../../core/store/views/view';
import {computeElementPositionInParent} from '../../../utils/common.utils';
import {MenuItem} from '../../../menu/model/menu-item';

@Component({
  selector: '[table-header]',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderComponent implements OnChanges {
  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public editedCell: EditedTableCell;

  @Output()
  public moveColumn = new EventEmitter<{fromIndex: number; toIndex: number}>();

  @Output()
  public dragStart = new EventEmitter();

  @Output()
  public dragEnd = new EventEmitter();

  @Output()
  public onClick = new EventEmitter<string>();

  @Output()
  public onDoubleClick = new EventEmitter<string>();

  @Output()
  public onCancel = new EventEmitter<string>();

  @Output()
  public menuSelected = new EventEmitter<{column: TableColumn; item: MenuItem}>();

  @Output()
  public hiddenMenuSelected = new EventEmitter<TableColumn[]>();

  @Output()
  public onRename = new EventEmitter<{column: TableColumn; name: string}>();

  @Output()
  public sortChanged = new EventEmitter<{column: TableColumn; type: AttributeSortType | null}>();

  @ViewChildren('resizeHandle')
  public handlerElements: QueryList<ElementRef>;

  @ViewChildren(LinksListHeaderMenuComponent)
  public headerMenuElements: QueryList<LinksListHeaderMenuComponent>;

  public readonly tableRowHeight = TABLE_ROW_HEIGHT;
  public readonly cellType = TableCellType.Header;

  private columnsPositionsStart: number[];
  private dragStartOffset: number;

  public draggedIndex$ = new BehaviorSubject(-1);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.columnGroups) {
      this.computeColumnsPositions();
    }
  }

  private computeColumnsPositions() {
    this.columnsPositionsStart = [];
    for (let i = 0; i < this.columnGroups?.length; i++) {
      this.columnsPositionsStart[i] = (this.columnsPositionsStart[i - 1] || 0) + (this.columnGroups[i - 1]?.width || 0);
    }
  }

  public trackByColumn(index: number, column: TableColumnGroup): string {
    return column.id;
  }

  public onColumnDrop(event: CdkDragDrop<any>) {
    const startPosition = this.getStartPosition(event.previousIndex);
    const newPosition = startPosition + event.distance.x;
    const previousIndex = this.computeColumnIndex(event.previousIndex);
    const groupIndex = this.findGroupIndexByStartPosition(newPosition);
    const direction = groupIndex - event.previousIndex;
    const toIndex = this.computeColumnIndex(groupIndex, direction);
    if (previousIndex !== toIndex) {
      this.moveColumn.emit({fromIndex: previousIndex, toIndex});
    }
    this.dragStartOffset = null;
  }

  private computeColumnIndex(groupIndex: number, direction?: number): number {
    const resultIndex = (this.columnGroups || [])
      .slice(0, groupIndex)
      .reduce((sum, group) => (sum += group.hiddenColumns?.length || 1), 0);

    const columnGroup = this.columnGroups?.[groupIndex];
    if (direction > 0 && columnGroup?.hiddenColumns?.length) {
      return resultIndex - 1 + columnGroup?.hiddenColumns?.length;
    }
    return resultIndex;
  }

  private getStartPosition(index: number): number {
    return (this.columnsPositionsStart[index] || 0) + (this.dragStartOffset || 0);
  }

  private findGroupIndexByStartPosition(x: number): number {
    if (x <= 0) {
      return 0;
    }
    return this.columnsPositionsStart?.findIndex(
      (position, index, arr) => position <= x && (index === arr.length - 1 || x <= arr[index + 1])
    );
  }

  public onColumnDragMoved(event: CdkDragMove, index: number) {
    const startPosition = this.getStartPosition(index);
    const newPosition = startPosition + event.distance.x;
    const toIndex = this.findGroupIndexByStartPosition(newPosition);
    if (this.canDragColumns(index, toIndex)) {
      this.draggedIndex$.next(toIndex);
    }
  }

  private canDragColumns(fromIndex: number, toIndex: number): boolean {
    const fromColumn = this.columnGroups?.[fromIndex]?.column;
    const toColumn = this.columnGroups?.[toIndex]?.column;
    return this.columnsAreFromSameResource(fromColumn, toColumn);
  }

  private columnsAreFromSameResource(c1: TableColumn, c2: TableColumn): boolean {
    return (
      c1 && c2 && ((c1.collectionId && c1.collectionId === c2.collectionId) || (c1 && c1.linkTypeId === c2.linkTypeId))
    );
  }

  public onColumnDragEnded() {
    this.draggedIndex$.next(-1);
    this.dragEnd.emit();
  }

  public onMouseDown(event: MouseEvent) {
    this.dragStartOffset = computeElementPositionInParent(event, 'th').x;
  }

  public onColumnDragStarted() {
    this.dragStart.emit();
  }

  public onHeaderClick(column: TableColumn) {
    if (column && !this.editingColumn(column)) {
      this.onClick.emit(column.id);
    }
  }

  public onHeaderDoubleClick(column: TableColumn) {
    if (column && !this.editingColumn(column)) {
      this.onDoubleClick.emit(column.id);
    }
  }

  private editingColumn(column: TableColumn): boolean {
    return this.editedCell?.columnId === column.id && this.editedCell?.tableId === column.tableId;
  }

  public onHeaderCancel(column: TableColumn) {
    if (column) {
      this.onCancel.emit(column.id);
    }
  }

  public onHeaderSave(column: TableColumn, name: string) {
    if (column) {
      this.onRename.emit({column, name});
    }
  }

  public onMenuSelected(column: TableColumn, item: MenuItem) {
    if (column) {
      this.menuSelected.emit({column, item});
    }
  }

  public onSortChanged(column: TableColumn, type?: AttributeSortType) {
    if (column) {
      this.sortChanged.emit({column, type});
    }
  }
}
