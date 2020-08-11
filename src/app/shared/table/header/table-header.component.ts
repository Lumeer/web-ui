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
  Renderer2,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {TableColumn} from '../model/table-column';
import {ContextMenuService} from 'ngx-contextmenu';
import {LinksListHeaderMenuComponent} from '../../links/links-list/table/header/menu/links-list-header-menu.component';
import {CdkDragDrop, CdkDragMove} from '@angular/cdk/drag-drop';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: '[table-header]',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderComponent implements OnChanges {
  @Input()
  public columns: TableColumn[];

  @Output()
  public moveColumn = new EventEmitter<{fromIndex: number; toIndex: number}>();

  @Output()
  public attributeFunction = new EventEmitter<TableColumn>();

  @Output()
  public attributeType = new EventEmitter<TableColumn>();

  @Output()
  public dragStart = new EventEmitter();

  @Output()
  public dragEnd = new EventEmitter();

  @ViewChildren('resizeHandle')
  public handlerElements: QueryList<ElementRef>;

  @ViewChildren(LinksListHeaderMenuComponent)
  public headerMenuElements: QueryList<LinksListHeaderMenuComponent>;

  private columnsPositionsStart: number[];
  private dragStartOffset: number;

  public draggedIndex$ = new BehaviorSubject(-1);

  constructor(private renderer: Renderer2, private contextMenuService: ContextMenuService) {}

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
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }

  public onContextMenu(column: number, event: MouseEvent) {
    const menuElement = this.headerMenuElements.toArray()[column];
    if (menuElement) {
      this.contextMenuService.show.next({
        contextMenu: menuElement.contextMenu,
        event,
        item: null,
      });
    }

    event.preventDefault();
    event.stopPropagation();
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
}
