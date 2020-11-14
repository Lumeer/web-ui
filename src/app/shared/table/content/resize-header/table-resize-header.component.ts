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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, Renderer2, ElementRef} from '@angular/core';
import {TableColumn, TableColumnGroup} from '../../model/table-column';
import {CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {TABLE_COLUMN_MIN_WIDTH, TABLE_ROW_HEIGHT} from '../../model/table-model';

@Component({
  selector: 'table-resize-header',
  templateUrl: './table-resize-header.component.html',
  styleUrls: ['./table-resize-header.component.scss', '../header/table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'w-100'},
})
export class TableResizeHeaderComponent {
  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public scrollId: string;

  @Output()
  public resizeColumn = new EventEmitter<{column: TableColumn; width: number}>();

  public readonly tableRowHeight = TABLE_ROW_HEIGHT;

  private headerElementsCache: Record<number, HTMLElement> = {};

  constructor(private renderer: Renderer2, private element: ElementRef) {}

  public trackByColumn(index: number, column: TableColumnGroup): string {
    return column.id;
  }

  public onResizeEnd(dragEnd: CdkDragEnd, index: number) {
    const width = this.computeNewWidth(index, dragEnd.distance);
    const column = this.columnGroups[index]?.column;
    if (column) {
      this.resizeColumn.emit({column, width});
    }
    this.setHeaderElementWidth(index, width);
    dragEnd.source.reset();

    delete this.headerElementsCache[index];
  }

  public onResizeMoved(dragMove: CdkDragMove, index: number) {
    const width = this.computeNewWidth(index, dragMove.distance);
    this.setHeaderElementWidth(index, width);
  }

  private setHeaderElementWidth(index: number, width: number) {
    const element = this.headerElementsCache[index] || this.findHeaderElement(index);
    this.headerElementsCache[index] = element;
    if (element && element.offsetWidth !== width) {
      this.renderer.setStyle(element, 'width', String(width) + 'px');
    }
  }

  private findHeaderElement(index: number): HTMLElement {
    const headerElements = this.element.nativeElement?.parentElement?.getElementsByTagName('th');
    return headerElements?.[index];
  }

  private computeNewWidth(index: number, distance: {x: number}): number {
    const width = Math.max(TABLE_COLUMN_MIN_WIDTH, this.columnGroups[index].width + distance.x);
    return width - (width % 1);
  }
}
