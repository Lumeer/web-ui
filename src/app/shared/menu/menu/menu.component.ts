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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatMenu} from '@angular/material/menu';
import {MenuItem} from '../model/menu-item';
import {preventEvent} from '../../utils/common.utils';

@Component({
  selector: 'lmr-menu',
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  @Input()
  public menuItems: MenuItem[];

  @Input()
  public selectedItem: MenuItem;

  @Output()
  public itemSelected = new EventEmitter<MenuItem>();

  @Output()
  public pathSelected = new EventEmitter<MenuItem[]>();

  @ViewChild('childMenu', {static: true})
  public childMenu: MatMenu;

  public onSelect(item: MenuItem, event: MouseEvent) {
    if (item.selectDisabled) {
      preventEvent(event);
    } else {
      this.itemSelected.emit(item);
      this.pathSelected.emit([item]);
    }
  }

  public onSelectChild(item: MenuItem, path: MenuItem[]) {
    this.itemSelected.emit(path[path.length - 1]);
    this.pathSelected.emit([item, ...path]);
  }
}
