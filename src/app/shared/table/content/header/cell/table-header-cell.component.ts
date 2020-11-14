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
import {TableColumn, TableContextMenuItem} from '../../../model/table-column';
import {TableMenuComponent} from '../../common/menu/table-menu.component';
import {computeElementPositionInParent, preventEvent} from '../../../../utils/common.utils';
import {ContextMenuService} from 'ngx-contextmenu';
import {TableHeaderHiddenMenuComponent} from './hidden-menu/table-header-hidden-menu.component';
import {AttributeSortType} from '../../../../../core/store/views/view';

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
  public hiddenColumns: TableColumn[];

  @Input()
  public restrictedNames: string[];

  @Input()
  public editing: boolean;

  @Input()
  public editingValue: any;

  @Input()
  public offsetHorizontal: boolean;

  @Output()
  public onCancel = new EventEmitter();

  @Output()
  public newName = new EventEmitter<string>();

  @Output()
  public sortChanged = new EventEmitter<AttributeSortType | null>();

  @Output()
  public menuSelected = new EventEmitter<TableContextMenuItem>();

  @Output()
  public hiddenMenuSelected = new EventEmitter<TableColumn[]>();

  @ViewChild(TableMenuComponent)
  public contextMenuComponent: TableMenuComponent;

  @ViewChild(TableHeaderHiddenMenuComponent)
  public hiddenMenuComponent: TableHeaderHiddenMenuComponent;

  public readonly sortType = AttributeSortType;

  constructor(private contextMenuService: ContextMenuService) {}

  public onHeaderCancel() {
    this.onCancel.emit();
  }

  public onHeaderSave(name: string) {
    if (!this.column.attribute || this.column.attribute.name !== name) {
      this.newName.emit(name);
    }
  }

  public onContextMenu(event: MouseEvent) {
    if (!this.column?.hidden && this.column.menuItems?.length) {
      const {x, y} = computeElementPositionInParent(event, 'table-header-cell');
      this.contextMenuComponent?.open(x, y);

      preventEvent(event);
    }
  }

  public onHiddenContextMenu(event: MouseEvent) {
    if (this.hiddenColumns?.length) {
      const {x, y} = computeElementPositionInParent(event, 'table-header-cell');
      this.hiddenMenuComponent?.open(x, y);

      preventEvent(event);
    }
  }

  public onHiddenMenuSelected(columns: TableColumn[]) {
    this.hiddenMenuSelected.emit(columns);
  }

  public onSortToggle(event: MouseEvent) {
    preventEvent(event);

    if (!this.column.sort) {
      this.sortChanged.emit(AttributeSortType.Ascending);
    } else if (this.column.sort === AttributeSortType.Ascending) {
      this.sortChanged.emit(AttributeSortType.Descending);
    } else {
      this.sortChanged.emit(null);
    }
  }
}
