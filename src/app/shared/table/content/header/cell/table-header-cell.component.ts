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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {TableColumn} from '../../../model/table-column';
import {TableHeaderMenuComponent} from './menu/table-header-menu.component';
import {preventEvent} from '../../../../utils/common.utils';
import {ContextMenuService} from 'ngx-contextmenu';
import {ModalService} from '../../../../modal/modal.service';

@Component({
  selector: 'table-header-cell',
  templateUrl: './table-header-cell.component.html',
  styleUrls: ['./table-header-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block h-100'},
})
export class TableHeaderCellComponent {
  @Input()
  public column: TableColumn;

  @Input()
  public editing: boolean;

  @Input()
  public editingValue: any;

  @Input()
  public offsetTop: boolean;

  @Output()
  public onCancel = new EventEmitter();

  @Output()
  public newName = new EventEmitter<string>();

  @Output()
  public edit = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public hide = new EventEmitter();

  @Output()
  public setDefaultAttribute = new EventEmitter();

  @ViewChild(TableHeaderMenuComponent)
  public contextMenuComponent: TableHeaderMenuComponent;

  constructor(private contextMenuService: ContextMenuService, private modalService: ModalService) {}

  public onHeaderCancel() {
    this.onCancel.emit();
  }

  public onHeaderSave(name: string) {
    this.newName.emit(name);
  }

  public onContextMenu(event: MouseEvent) {
    this.contextMenuService.show.next({
      contextMenu: this.contextMenuComponent?.contextMenu,
      event,
      item: null,
    });

    preventEvent(event);
  }

  public onAttributeFunction() {
    this.modalService.showAttributeFunction(this.column.attribute.id, this.column.collectionId, this.column.linkTypeId);
  }

  public onAttributeType() {
    this.modalService.showAttributeType(this.column.attribute.id, this.column.collectionId, this.column.linkTypeId);
  }
}
