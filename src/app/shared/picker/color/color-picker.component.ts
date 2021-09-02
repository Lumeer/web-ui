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
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  ViewChild,
  HostListener,
} from '@angular/core';
import {greyscale, palette, saturated, sepia} from '../colors';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {BehaviorSubject} from 'rxjs';
import {preventEvent} from '../../utils/common.utils';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public color: string;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public saveOnClose = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public showPicker$ = new BehaviorSubject(false);

  private selectedValue: string;

  public readonly localPalette = [...greyscale, '#ffffff', ...sepia, ...saturated, ...palette];
  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
    DropdownPosition.Right,
    DropdownPosition.Left,
  ];

  public onCancel() {
    this.close();
    this.cancel.emit();
    this.selectedValue = null;
  }

  public onSelect(value: string) {
    this.close();
    this.save.emit(value);
    this.selectedValue = null;
  }

  public open() {
    this.showPicker$.next(true);
    if (this.dropdown) {
      this.dropdown.open();
    }
    this.selectedValue = null;
  }

  public close() {
    this.showPicker$.next(false);
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public toggle() {
    if (this.dropdown) {
      if (this.dropdown.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape) {
      preventEvent(event);
      this.onCancel();
    }
  }

  public onChange(value: string) {
    this.valueChange.emit(value);
    this.selectedValue = value;
  }

  public onCloseByClickOutside() {
    this.saveOnClose.emit(this.selectedValue);
    this.selectedValue = null;
  }
}
