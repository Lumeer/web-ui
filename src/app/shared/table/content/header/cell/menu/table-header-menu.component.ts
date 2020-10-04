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
import {ContextMenuComponent} from 'ngx-contextmenu';
import {TableColumn} from '../../../../model/table-column';

@Component({
  selector: 'table-header-menu',
  templateUrl: './table-header-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderMenuComponent {
  @Input()
  public column: TableColumn;

  @Output()
  public attributeType = new EventEmitter();

  @Output()
  public attributeFunction = new EventEmitter();

  @Output()
  public edit = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public hide = new EventEmitter();

  @Output()
  public setDefaultAttribute = new EventEmitter();

  @ViewChild(ContextMenuComponent, {static: true})
  public contextMenu: ContextMenuComponent;
}
