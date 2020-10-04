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
import {TableColumn} from '../../model/table-column';
import {LinksListHeaderMenuComponent} from '../../../links/links-list/table/header/menu/links-list-header-menu.component';
import {CdkDragDrop, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject} from 'rxjs';
import {EditedTableCell, SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType} from '../../model/table-model';
import {AppState} from '../../../../core/store/app.state';
import {Action, Store} from '@ngrx/store';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';

@Component({
  selector: '[table-header]',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderComponent implements OnChanges {
  @Input()
  public columns: TableColumn[];

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

  @ViewChildren('resizeHandle')
  public handlerElements: QueryList<ElementRef>;

  @ViewChildren(LinksListHeaderMenuComponent)
  public headerMenuElements: QueryList<LinksListHeaderMenuComponent>;

  public readonly tableRowHeight = TABLE_ROW_HEIGHT;
  public readonly cellType = TableCellType.Header;

  private columnsPositionsStart: number[];
  private dragStartOffset: number;

  public draggedIndex$ = new BehaviorSubject(-1);

  constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.columns) {
      this.computeColumnsPositions();
    }
  }

  private computeColumnsPositions() {
    this.columnsPositionsStart = [];
    for (let i = 0; i < this.columns?.length; i++) {
      this.columnsPositionsStart[i] = (this.columnsPositionsStart[i - 1] || 0) + (this.columns[i - 1]?.width || 0);
    }
  }

  public trackByColumn(index: number, column: TableColumn): string {
    return column.id;
  }

  public onColumnDrop(event: CdkDragDrop<any>) {
    const startPosition = this.getStartPosition(event.previousIndex);
    const newPosition = startPosition + event.distance.x;
    const toIndex = this.findColumnIndexByStartPosition(newPosition);
    if (event.previousIndex !== toIndex) {
      this.moveColumn.emit({fromIndex: event.previousIndex, toIndex});
    }
    this.dragStartOffset = null;
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
    this.draggedIndex$.next(toIndex);
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

  public onHeaderClick(columnId: string) {
    this.onClick.emit(columnId);
  }

  public onHeaderDoubleClick(columnId: string) {
    this.onDoubleClick.emit(columnId);
  }

  public onHeaderCancel(columnId: string) {
    this.onCancel.emit(columnId);
  }

  public onHeaderSave(column: TableColumn, name: string) {
    if (column?.attribute && column?.collectionId) {
      this.store$.dispatch(
        new CollectionsAction.RenameAttribute({
          collectionId: column.collectionId,
          attributeId: column.attribute.id,
          name,
        })
      );
    }
    // TODO link
  }

  public setDefaultAttribute(column: TableColumn) {
    if (column?.collectionId && column?.attribute?.id) {
      this.store$.dispatch(
        new CollectionsAction.SetDefaultAttribute({
          attributeId: column.attribute.id,
          collectionId: column.collectionId,
        })
      );
    }
  }

  public onColumnEdit(columnId: string) {
    this.onDoubleClick.emit(columnId);
  }

  public onColumnRemove(column: TableColumn) {
    const attributeId = column?.attribute?.id;
    let action: Action;
    if (attributeId && column.collectionId) {
      action = new CollectionsAction.RemoveAttribute({collectionId: column.collectionId, attributeId});
    } else if (column?.attribute?.id && column.linkTypeId) {
      action = new LinkTypesAction.DeleteAttribute({linkTypeId: column.linkTypeId, attributeId});
    }

    if (action) {
      const title = this.i18n({id: 'table.delete.column.dialog.title', value: 'Delete this column?'});
      const message = this.i18n({
        id: 'table.delete.column.dialog.message',
        value: 'Do you really want to delete the column? This will permanently remove the attribute and all its data.',
      });

      this.store$.dispatch(new NotificationsAction.Confirm({title, message, action, type: 'danger'}));
    }
  }
}
