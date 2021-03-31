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
import {DropdownPosition} from '../dropdown-position';
import {DropdownComponent} from '../dropdown.component';
import {DropdownOption} from './dropdown-option';
import {DropdownOptionDirective} from './dropdown-option.directive';
import {deepObjectsEquals, isNotNullOrUndefined, isNullOrUndefined} from '../../utils/common.utils';
import {BehaviorSubject} from 'rxjs';
import {USER_AVATAR_SIZE} from '../../../core/constants';
import {isTopPositionDropdown} from '../util/dropdown-util';

@Component({
  selector: 'options-dropdown',
  templateUrl: './options-dropdown.component.html',
  styleUrls: ['./options-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsDropdownComponent implements OnChanges {
  @Input()
  public closeOnClickOutside = true;

  @Input()
  public closeOnClickOrigin: boolean;

  @Input()
  public showBackdrop = true;

  @Input()
  public positionReverse = true;

  @Input()
  public fitParent: boolean;

  @Input()
  public options: DropdownOption[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public firstItemActive: boolean;

  @Input()
  public highlightedText: string;

  @Input()
  public highlightedValue: any;

  @Input()
  public selectedValues: any[];

  @Input()
  public multiSelect: boolean;

  @Input()
  public minWidth: number;

  @Output()
  public selectOption = new EventEmitter<DropdownOption>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChildren(DropdownOptionDirective)
  public dropdownOptions: QueryList<DropdownOptionDirective>;

  public readonly avatarSize = USER_AVATAR_SIZE;

  public activeValue$ = new BehaviorSubject<any>(null);
  public dropdownPosition$ = new BehaviorSubject<DropdownPosition>(null);

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
  ];

  public ngOnChanges(changes: SimpleChanges) {
    if (this.shouldResetActiveItem(changes)) {
      this.activeValue$.next(this.firstItemActive ? this.firstOptionValue() : null);
    }
  }

  private firstOptionValue(): any {
    const isTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);
    if (isTopPosition && this.options) {
      return this.optionValue(this.options.length - 1);
    }
    return this.optionValue(0);
  }

  private optionValue(index: number): any {
    const option = (this.options || [])[index];
    return option && option.value;
  }

  private shouldResetActiveItem(changes: SimpleChanges): boolean {
    return this.activeValueNotFound(changes) || this.highlightedValueWasDeleted(changes);
  }

  private activeValueNotFound(changes: SimpleChanges): boolean {
    const value = this.activeValue$.value;
    return changes.options && (isNullOrUndefined(value) || !this.valueExist(value));
  }

  private valueExist(value: any): boolean {
    return (this.options || []).some(option => option.value === value);
  }

  private highlightedValueWasDeleted(changes: SimpleChanges) {
    return (
      changes.highlightedValue &&
      isNotNullOrUndefined(changes.highlightedValue.previousValue) &&
      isNullOrUndefined(changes.highlightedValue.currentValue)
    );
  }

  public onOptionSelect(event: MouseEvent, option: DropdownOption) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.selectOption.emit(option);
    if (!this.multiSelect) {
      this.close();
    }
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
      this.highlightSelectedValue();
    }
  }

  private highlightSelectedValue() {
    if (isNotNullOrUndefined(this.highlightedValue)) {
      const activeOption = (this.options || []).find(option => deepObjectsEquals(option.value, this.highlightedValue));
      setTimeout(() => this.activeValue$.next(activeOption?.value));
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowUp:
        this.moveSelectionUp();
        break;
      case KeyCode.ArrowDown:
        this.moveSelectionDown();
        break;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        const activeItem = this.getActiveOption();
        if (activeItem) {
          this.selectOption.emit(activeItem);
          this.close();
        }
        break;
    }
  }

  private moveSelectionDown() {
    const isTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);
    const selectedIndex = this.selectedIndex(this.activeValue$.value);

    let newIndex = -1;
    if (isTopPosition && selectedIndex > 0) {
      newIndex = selectedIndex - 1;
    }
    if (!isTopPosition) {
      newIndex = Math.min(this.options.length - 1, selectedIndex + 1);
    }

    if (newIndex >= 0) {
      this.activeValue$.next(this.optionValue(newIndex));
    }
  }

  private selectedIndex(value: any): number {
    return (this.options || []).findIndex(option => option.value === value);
  }

  private moveSelectionUp() {
    const isTopPosition = isTopPositionDropdown(this.dropdownPosition$.value);
    const selectedIndex = this.selectedIndex(this.activeValue$.value);

    let newIndex: number;
    if (isTopPosition && selectedIndex < this.options.length - 1) {
      newIndex = selectedIndex + 1;
    }

    if (!isTopPosition) {
      newIndex = Math.max(0, selectedIndex - 1);
    }

    if (newIndex >= 0) {
      this.activeValue$.next(this.optionValue(newIndex));
    }
  }

  public getActiveOption(): DropdownOption {
    const value = this.activeValue$.value;
    return value && (this.options || []).find(option => option.value === value);
  }

  public resetActiveOption() {
    this.activeValue$.next(null);
  }

  public onPositionChange(position: DropdownPosition) {
    if (this.positionReverse) {
      this.dropdownPosition$.next(position);
    }
  }
}
