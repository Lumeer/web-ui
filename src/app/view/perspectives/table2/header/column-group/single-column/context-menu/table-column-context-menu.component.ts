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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {AttributeModel} from '../../../../../../../core/store/collections/collection.model';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';

@Component({
  selector: 'table-column-context-menu',
  templateUrl: './table-column-context-menu.component.html',
  styleUrls: ['./table-column-context-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableColumnContextMenuComponent {

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public attribute: AttributeModel;

  @Input()
  public leaf: boolean;

  @Output()
  public add = new EventEmitter<boolean>();

  @Output()
  public edit = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public hide = new EventEmitter();

  @Output()
  public split = new EventEmitter();

  @ViewChild('contextMenu')
  public contextMenu: ElementRef;

  public addNextColumn() {
    this.add.emit(true);
  }

  public addPreviousColumn() {
    this.add.emit(false);
  }

}
