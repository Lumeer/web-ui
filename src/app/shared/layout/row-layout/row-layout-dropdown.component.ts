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

import {Component, ChangeDetectionStrategy, Input, ElementRef, Output, EventEmitter, ViewChild} from '@angular/core';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {defaultRowLayouts, RowLayoutType} from './row-layout';

@Component({
  selector: 'row-layout-dropdown',
  templateUrl: './row-layout-dropdown.component.html',
  styleUrls: ['./row-layout-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RowLayoutDropdownComponent {

  @Input()
  public selectedLayout: RowLayoutType;

  @Input()
  public layouts: RowLayoutType[] = defaultRowLayouts;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public showSelection: boolean;

  @Input()
  public fitParent: boolean;

  @Output()
  public layoutSelected = new EventEmitter<RowLayoutType>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
  ];

  public toggle() {
    if (this.dropdown?.isOpen()) {
      this.close();
    } else {
      this.open();
    }
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

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public onChooseLayout(layout: RowLayoutType) {
    this.layoutSelected.emit(layout);
    this.close();
  }
}
