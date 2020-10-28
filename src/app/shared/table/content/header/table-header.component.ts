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
import {TableColumn, TableColumnGroup, TableContextMenuItem} from '../../model/table-column';
import {LinksListHeaderMenuComponent} from '../../../links/links-list/table/header/menu/links-list-header-menu.component';
import {CdkDragDrop, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject} from 'rxjs';
import {EditedTableCell, SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType} from '../../model/table-model';
import {groupTableColumns} from '../../model/table-utils';
import {AttributeSortType} from '../../../../core/store/views/view';

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
  public menuSelected = new EventEmitter<{column: TableColumn; item: TableContextMenuItem}>();

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
    const toIndex = this.computeColumnIndex(this.findColumnIndexByStartPosition(newPosition));
    const previousIndex = this.computeColumnIndex(event.previousIndex);
    if (previousIndex !== toIndex) {
      this.moveColumn.emit({fromIndex: previousIndex, toIndex});
    }
    this.dragStartOffset = null;
  }

  private computeColumnIndex(groupIndex: number): number {
    return (this.columnGroups || [])
      .slice(0, groupIndex)
      .reduce((sum, group) => (sum += group.hiddenColumns?.length || 1), 0);
  }

  private getStartPosition(index: number): number {
    return (this.columnsPositionsStart[index] || 0) + (this.dragStartOffset || 0);
  }

  private findColumnIndexByStartPosition(x: number): number {
    return this.columnsPositionsStart?.findIndex(
      (position, index, arr) => position <= x && (index === arr.length - 1 || x <= arr[index + 1])
    );
  }

  public onColumnDragMoved(event: CdkDragMove, index: number) {
    const startPosition = this.getStartPosition(index);
    const newPosition = startPosition + event.distance.x;
    const toIndex = this.findColumnIndexByStartPosition(newPosition);
    const columnGroup = this.columnGroups?.[toIndex];
    if (columnGroup?.column) {
      this.draggedIndex$.next(toIndex);
    }
  }

  public onColumnDragEnded() {
    this.draggedIndex$.next(-1);
    this.dragEnd.emit();
  }

  public onMouseDown(event: MouseEvent) {
    this.dragStartOffset = this.offsetLeft(event);
  }

  private offsetLeft(event: MouseEvent): number {
    let offset = event.offsetX;
    let parent = event.target as HTMLElement;
    while (parent && parent.tagName.toLowerCase() !== 'th') {
      offset += parent.offsetLeft;
      parent = parent.offsetParent as HTMLElement;
    }

    return offset;
  }

  public onColumnDragStarted() {
    this.dragStart.emit();
  }

  public onHeaderClick(column: TableColumn) {
    if (column) {
      this.onClick.emit(column.id);
    }
  }

  public onHeaderDoubleClick(column: TableColumn) {
    if (column) {
      this.onDoubleClick.emit(column.id);
    }
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

  public onMenuSelected(column: TableColumn, item: TableContextMenuItem) {
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
