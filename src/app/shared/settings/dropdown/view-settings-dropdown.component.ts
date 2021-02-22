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
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {AttributesSettings, DataSettings, ViewSettings} from '../../../core/store/views/view';

@Component({
  selector: 'view-settings-dropdown',
  templateUrl: './view-settings-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSettingsDropdownComponent {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public settings: ViewSettings;

  @Input()
  public showAttributes: boolean;

  @Output()
  public attributeSettingsChanged = new EventEmitter<AttributesSettings>();

  @Output()
  public dataSettingsChange = new EventEmitter<DataSettings>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public open() {
    this.dropdown?.open();
  }

  public close() {
    this.dropdown?.close();
  }
}
