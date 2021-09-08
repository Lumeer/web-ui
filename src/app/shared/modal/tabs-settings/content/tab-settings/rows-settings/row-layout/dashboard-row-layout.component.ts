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

import {Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, Output, EventEmitter} from '@angular/core';
import {DropdownPosition} from '../../../../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../../../../dropdown/dropdown.component';
import {DashboardLayoutType, DashboardRow, dashboardRowLayouts} from '../../../../../../../core/model/dashboard-tab';

@Component({
  selector: 'dashboard-row-layout',
  templateUrl: './dashboard-row-layout.component.html',
  styleUrls: ['./dashboard-row-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardRowLayoutComponent {

  @Input()
  public row: DashboardRow;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public layoutSelected = new EventEmitter<DashboardLayoutType>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
  ];

  public layouts = dashboardRowLayouts;

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

  public onChooseLayout(layout: DashboardLayoutType) {
    this.layoutSelected.emit(layout);
    this.close();
  }
}
