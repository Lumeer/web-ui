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
  EventEmitter,
  Input,
  Output,
  ElementRef,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import {DropdownPosition} from '../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../dropdown/dropdown.component';
import {SelectItemModel} from '../select-item.model';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';

@Component({
  selector: 'select-item-dropdown',
  templateUrl: './select-item-dropdown.component.html',
  styleUrls: ['./select-item-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemDropdownComponent {
  @Input()
  public origin: HTMLElement;

  @Input()
  public items: SelectItemModel[];

  @Input()
  public selectedId: any;

  @Input()
  public fitParent: boolean;

  @Output()
  public selectItem = new EventEmitter<SelectItemModel>();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart, DropdownPosition.TopStart];

  public onSelect(item: SelectItemModel) {
    this.close();
    this.selectItem.emit(item);
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
}
