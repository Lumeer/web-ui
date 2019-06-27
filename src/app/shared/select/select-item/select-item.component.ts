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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SelectItemModel} from './select-item.model';
import {SelectItemDropdownComponent} from './select-item-dropdown/select-item-dropdown.component';

@Component({
  selector: 'select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemComponent {
  @Input()
  public items: SelectItemModel[];

  @Input()
  public selectedId: any;

  @Input()
  public placeholderIcon: string;

  @Input()
  public placeholderText: string = '';

  @Input()
  public emptyValue: string = '';

  @Input()
  public disabled: boolean;

  @Input()
  public removable: boolean = false;

  @Input()
  public buttonClasses: string;

  @Input()
  public fitParent = true;

  @Output()
  public select = new EventEmitter<any>();

  @Output()
  public remove = new EventEmitter();

  @ViewChild(SelectItemDropdownComponent, {static: false})
  public selectItemDropdown: SelectItemDropdownComponent;

  public onSelect(item: SelectItemModel) {
    this.select.emit(item.id);
  }

  public onRemove(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.remove.emit();
  }

  public onDropdownClick() {
    this.selectItemDropdown.open();
  }
}
