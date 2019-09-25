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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {SelectDataItemModel} from './select-data-item.model';
import {DataOptionsDropdownComponent} from '../../data-dropdown/data-options/data-options-dropdown.component';
import {DataDropdownOption} from '../../data-dropdown/data-options/data-dropdown-option';

@Component({
  selector: 'select-data-item',
  templateUrl: './select-data-item.component.html',
  styleUrls: ['./select-data-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDataItemComponent implements OnChanges {
  @Input()
  public items: SelectDataItemModel[];

  @Input()
  public selectedId: any;

  @Input()
  public placeholderIcon: string;

  @Input()
  public placeholderColor: string;

  @Input()
  public placeholderTitle: string;

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

  @ViewChild(DataOptionsDropdownComponent, {static: false})
  public dropdown: DataOptionsDropdownComponent;

  public dropdownOptions: DataDropdownOption[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.items && this.items) {
      this.dropdownOptions = createDropdownOptions(this.items);
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.dropdown.isOpen()) {
      event.preventDefault();
      this.dropdown.onKeyDown(event);
    }
  }

  public onSelect(option: DataDropdownOption) {
    this.select.emit(option.value);
  }

  public onRemove(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.remove.emit();
  }

  public onDropdownClick() {
    this.dropdown.open();
  }
}

function createDropdownOptions(items: SelectDataItemModel[]): DataDropdownOption[] {
  return (items || []).map(item => ({
    value: item.id,
    displayValue: item.value,
    constraint: item.constraint,
  }));
}
