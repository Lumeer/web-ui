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
import {MatMenuTrigger} from '@angular/material/menu';
import {MenuItem} from '../model/menu-item';

@Component({
  selector: 'lmr-static-menu',
  templateUrl: './static-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticMenuComponent {
  @Input()
  public id: string;

  @Input()
  public items: MenuItem[];

  @Output()
  public itemSelected = new EventEmitter<MenuItem>();

  @Output()
  public pathSelected = new EventEmitter<MenuItem[]>();

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public contextMenuPosition = {x: 0, y: 0};

  public open(x: number, y: number) {
    this.contextMenuPosition = {x, y};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  public onSelected(item: MenuItem) {
    this.contextMenu.closeMenu();
    this.itemSelected.emit(item);
  }

  public onPathSelected(path: MenuItem[]) {
    this.contextMenu.closeMenu();
    this.pathSelected.emit(path);
  }
}
