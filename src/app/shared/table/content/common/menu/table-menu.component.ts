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

import {Component, ChangeDetectionStrategy, Output, EventEmitter, ViewChild, Input} from '@angular/core';
import {TableContextMenuItem} from '../../../model/table-column';
import {MatMenuTrigger} from '@angular/material/menu';
import {preventEvent} from '../../../../utils/common.utils';

@Component({
  selector: 'table-menu',
  templateUrl: './table-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableMenuComponent {
  @Input()
  public id: string;

  @Input()
  public items: TableContextMenuItem[];

  @Output()
  public selected = new EventEmitter<TableContextMenuItem>();

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public contextMenuPosition = {x: 0, y: 0};

  public open(x: number, y: number) {
    this.contextMenuPosition = {x, y};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  public onClick(event: MouseEvent, item: TableContextMenuItem) {
    preventEvent(event);
    this.contextMenu.closeMenu();
    this.selected.emit(item);
  }
}
