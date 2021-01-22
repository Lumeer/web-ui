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
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {SelectItemModel} from './select-item.model';

@Component({
  selector: 'select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemComponent implements OnChanges, OnDestroy {
  @Input()
  public items: SelectItemModel[];

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

  @Input()
  public positionReverse = true;

  @Output()
  public selected = new EventEmitter<any>();

  @Output()
  public remove = new EventEmitter();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];

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

  public onSelect(option: DropdownOption) {
    this.selected.emit(option.value);
  }

  public onRemove(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.remove.emit();
  }

  public onDropdownClick() {
    this.dropdown.open();
  }

  public ngOnDestroy() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }
}

function createDropdownOptions(items: SelectItemModel[]): DropdownOption[] {
  return (items || []).map(item => ({
    value: item.id,
    displayValue: item.value,
    icons: item.icons,
    iconColors: item.iconColors,
  }));
}
