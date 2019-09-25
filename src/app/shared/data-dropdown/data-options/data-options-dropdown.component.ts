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

import {ActiveDescendantKeyManager, ListKeyManager} from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {KeyCode} from '../../key-code';
import {DataDropdownOption} from './data-dropdown-option';
import {deepObjectsEquals} from '../../utils/common.utils';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {DropdownOptionDirective} from '../../dropdown/options/dropdown-option.directive';
import {DropdownPosition} from '../../dropdown/dropdown-position';

@Component({
  selector: 'data-options-dropdown',
  templateUrl: './data-options-dropdown.component.html',
  styleUrls: ['./data-options-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataOptionsDropdownComponent implements AfterViewInit, OnChanges {
  @Input()
  public closeOnClickOutside: boolean;

  @Input()
  public fitParent: boolean;

  @Input()
  public options: DataDropdownOption[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public selectedValue: any;

  @Output()
  public selectOption = new EventEmitter<DataDropdownOption>();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  @ViewChildren(DropdownOptionDirective)
  public dropdownOptions: QueryList<DropdownOptionDirective>;

  private listKeyManager: ListKeyManager<DropdownOptionDirective>;

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
  ];

  public ngAfterViewInit() {
    this.listKeyManager = new ActiveDescendantKeyManager(this.dropdownOptions);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options && this.options) {
      this.listKeyManager && this.listKeyManager.setActiveItem(null);
    }
  }

  public onOptionClick(event: MouseEvent, option: DataDropdownOption) {
    event.preventDefault();
    this.selectOption.emit(option);
    this.close();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
      this.highlightSelectedValue();
    }
  }

  private highlightSelectedValue() {
    if ((this.listKeyManager && this.selectedValue) || this.selectedValue === 0) {
      const activeIndex = (this.options || []).findIndex(option => deepObjectsEquals(option.value, this.selectedValue));
      this.listKeyManager.setActiveItem(activeIndex);
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public isOpen(): boolean {
    return this.dropdown && this.dropdown.isOpen();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (!this.listKeyManager) {
      return;
    }

    this.listKeyManager.onKeydown(event);

    if (event.code === KeyCode.Enter || event.code === KeyCode.NumpadEnter) {
      this.selectOption.emit(this.listKeyManager.activeItem);
      this.close();
    }
  }

  public getActiveOption(): DataDropdownOption {
    return this.listKeyManager && this.listKeyManager.activeItem;
  }
}
