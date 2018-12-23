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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {ContextMenuComponent, ContextMenuService} from 'ngx-contextmenu';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {getTableElement} from '../../../../../../core/store/tables/table.utils';

@Component({
  selector: 'table-link-info',
  templateUrl: './table-link-info.component.html',
  styleUrls: ['./table-link-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLinkInfoComponent implements AfterViewInit {
  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public collections: Collection[];

  @Input()
  public linkType: LinkType;

  @Input()
  public switchingEnabled: boolean;

  @Input()
  public canManageView: boolean;

  @Output()
  public switchParts = new EventEmitter();

  @Output()
  public removePart = new EventEmitter();

  @ViewChild('linkMenu')
  public linkMenu: ElementRef;

  @ViewChild(ContextMenuComponent)
  public contextMenuComponent: ContextMenuComponent;

  constructor(private contextMenuService: ContextMenuService) {}

  public ngAfterViewInit() {
    this.setTableLinkInfoWidthCssVariable();
  }

  private setTableLinkInfoWidthCssVariable() {
    const tableElement = getTableElement(this.cursor.tableId);
    const width = this.linkMenu.nativeElement.clientWidth;
    tableElement.style.setProperty('--link-info-column-width', `${width}px`);
  }

  public onClick(event: MouseEvent) {
    this.showContextMenu(event);
    event.stopPropagation();
  }

  private showContextMenu(event: MouseEvent) {
    this.contextMenuService.show.next({
      anchorElement: null,
      contextMenu: this.contextMenuComponent,
      event,
      item: null,
    });
  }
}
