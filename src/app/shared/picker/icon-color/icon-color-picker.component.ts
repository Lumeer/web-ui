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
  ViewChild,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {IconChooseComponent} from './icon/icon-choose.component';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'icon-color-picker',
  templateUrl: './icon-color-picker.component.html',
  styleUrls: ['./icon-color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconColorPickerComponent implements OnDestroy {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public icon: string;

  @Input()
  public color: string;

  @Output()
  public cancel = new EventEmitter<{icon: string; color: string}>();

  @Output()
  public selected = new EventEmitter<{icon: string; color: string}>();

  @Output()
  public save = new EventEmitter<{icon: string; color: string}>();

  @Output()
  public preview = new EventEmitter<{icon: string; color: string}>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChild(IconChooseComponent)
  public iconPickerComponent: IconChooseComponent;

  private initialIcon: string;
  private initialColor: string;

  public selectedIcon$ = new BehaviorSubject('');
  public selectedColor$ = new BehaviorSubject('');

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
    DropdownPosition.Right,
    DropdownPosition.Left,
  ];

  public open() {
    this.dropdown && this.dropdown.open();
    this.iconPickerComponent && this.iconPickerComponent.scrollToSelection();

    this.initialIcon = this.icon;
    this.initialColor = this.color;

    this.selectedIcon$.next(this.icon);
    this.selectedColor$.next(this.color);
  }

  public close() {
    this.dropdown && this.dropdown.close();
    this.cancel.emit({color: this.initialColor, icon: this.initialIcon});
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

  public ngOnDestroy() {
    this.dropdown && this.dropdown.close();
  }

  public onCancel() {
    this.close();
  }

  public onSave() {
    const color = this.selectedColor$.getValue();
    const icon = this.selectedIcon$.getValue();
    this.save.emit({icon, color});
    this.dropdown && this.dropdown.close();
  }

  public onColorPreview(colorPreview: string) {
    const icon = this.selectedIcon$.getValue();
    const color = colorPreview || this.selectedColor$.getValue();
    this.preview.emit({icon, color});
  }

  public onColorSelected(color: string) {
    const icon = this.selectedIcon$.getValue();
    this.selected.emit({icon, color});
    this.selectedColor$.next(color);
  }

  public onIconSelected(icon: string) {
    const color = this.selectedColor$.getValue();
    this.selected.emit({icon, color});
    this.selectedIcon$.next(icon);
  }

  public onIconPreview(iconPreview: string) {
    const color = this.selectedColor$.getValue();
    const icon = iconPreview || this.selectedIcon$.getValue();
    this.preview.emit({icon, color});
  }
}
