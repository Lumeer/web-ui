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
import {DropdownPosition} from '../dropdown-position';
import {DropdownComponent} from '../dropdown.component';
import {DropdownOption} from './dropdown-option';
import {DropdownOptionDirective} from './dropdown-option.directive';

@Component({
  selector: 'options-dropdown',
  templateUrl: './options-dropdown.component.html',
  styleUrls: ['./options-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsDropdownComponent implements AfterViewInit, OnChanges {
  @Input()
  public options: DropdownOption[];

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public selectOption = new EventEmitter<DropdownOption>();

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

  public onOptionMouseDown(option: DropdownOption) {
    this.selectOption.emit(option);
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    if (!this.listKeyManager) {
      return;
    }

    this.listKeyManager.onKeydown(event);

    if (event.code === KeyCode.Enter || event.code === KeyCode.NumpadEnter) {
      this.selectOption.emit(this.listKeyManager.activeItem);
    }
  }

  public getActiveOption(): DropdownOption {
    return this.listKeyManager && this.listKeyManager.activeItem;
  }
}
