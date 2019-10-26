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
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {LinksListHeaderMenuComponent} from './menu/links-list-header-menu.component';
import {ContextMenuService} from 'ngx-contextmenu';

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

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public resizeColumn = new EventEmitter<{index: number; width: number}>();

  @Output()
  public attributeFunction = new EventEmitter<LinkColumn>();

  @Output()
  public attributeType = new EventEmitter<LinkColumn>();

  @ViewChildren('tableHeader')
  public tableHeaderElements: QueryList<ElementRef>;

  @ViewChildren('resizeHandle')
  public handlerElements: QueryList<ElementRef>;

  @ViewChildren(LinksListHeaderMenuComponent)
  public headerMenuElements: QueryList<LinksListHeaderMenuComponent>;

  constructor(private renderer: Renderer2, private contextMenuService: ContextMenuService) {}

  public trackByColumn(index: number, column: LinkColumn): string {
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }

  public onDragMoved(dragMove: CdkDragMove, index: number) {
    const element = this.tableHeaderElements.toArray()[index];
    const width = this.computeNewWidth(index, dragMove.distance);
    if (element && element.nativeElement.offsetWidth !== width) {
      this.renderer.setStyle(element.nativeElement, 'width', String(width) + 'px');
    }
  }

  private computeNewWidth(index: number, distance: {x: number}): number {
    const width = Math.max(columnMinWidth, this.columns[index].width + distance.x);
    return width - (width % 5);
  }

  public onDragEnd(dragEnd: CdkDragEnd, index: number) {
    const width = this.computeNewWidth(index, dragEnd.distance);
    this.resizeColumn.emit({index, width});

    const resizeElement = this.handlerElements.toArray()[index];
    if (resizeElement) {
      this.renderer.setStyle(resizeElement.nativeElement, 'transform', 'none');
    }
    dragEnd.source.reset();
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

  public onAttributeFunction(index: number) {
    const column = this.columns[index];
    if (column) {
      this.attributeFunction.emit(column);
    }
  }

  public onAttributeType(index: number) {
    const column = this.columns[index];
    if (column) {
      this.attributeType.emit(column);
    }
  }
}
