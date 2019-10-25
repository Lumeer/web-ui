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
  Renderer2,
  ViewChildren,
  QueryList,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import {LinkColumn} from '../../model/link-column';
import {CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';

const columnMinWidth = 30;

@Component({
  selector: '[links-list-table-header]',
  templateUrl: './links-list-table-header.component.html',
  styleUrls: ['./links-list-table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableHeaderComponent {
  @Input()
  public columns: LinkColumn[];

  @Output()
  public resizeColumn = new EventEmitter<{index: number; width: number}>();

  @ViewChildren('tableHeader')
  public tableHeaderElements: QueryList<ElementRef>;

  @ViewChildren('resizeHandle')
  public handlerElements: QueryList<ElementRef>;

  constructor(private renderer: Renderer2) {}

  public trackByLinkColumn(index: number, linkColumn: LinkColumn): string {
    return linkColumn.attribute.correlationId || linkColumn.attribute.id;
  }

  public onDragMoved(dragMove: CdkDragMove, index: number) {
    const element = this.tableHeaderElements.toArray()[index];
    const width = Math.max(columnMinWidth, this.columns[index].width + dragMove.distance.x);
    if (element) {
      this.renderer.setStyle(element.nativeElement, 'width', String(width) + 'px');
    }
  }

  public onDragEnd(dragEnd: CdkDragEnd, index: number) {
    const width = Math.max(columnMinWidth, this.columns[index].width + dragEnd.distance.x);
    this.resizeColumn.emit({index, width});

    const resizeElement = this.handlerElements.toArray()[index];
    if (resizeElement) {
      this.renderer.setStyle(resizeElement.nativeElement, 'transform', 'none');
    }
    dragEnd.source.reset();
  }
}
