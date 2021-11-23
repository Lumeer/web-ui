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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {SelectedItemDisplayValue, SelectItem2Model} from './select-item2.model';
import {preventEvent} from '../../utils/common.utils';
import {MenuItem} from '../../menu/model/menu-item';
import {convertMenuItemsPath} from '../../menu/model/menu-utils';
import {OverlayContainer} from '@angular/cdk/overlay';

@Component({
  selector: 'select-item2',
  templateUrl: './select-item2.component.html',
  styleUrls: ['./select-item2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItem2Component implements OnChanges {
  @Input()
  public items: SelectItem2Model[];

  @Input()
  public selectedPath: any[];

  @Input()
  public emptyValue: string = '';

  @Input()
  public disabled: boolean;

  @Input()
  public removable: boolean;

  @Input()
  public showAsLink = true;

  @Input()
  public bordered: boolean;

  @Input()
  public displayValue: SelectedItemDisplayValue;

  @Input()
  public stopEventsPropagation: boolean;

  @Output()
  public selectPath = new EventEmitter<SelectItem2Model[]>();

  @Output()
  public remove = new EventEmitter();

  public menuItems: MenuItem[];

  private mouseDownListener: any;

  constructor(private overlayContainer: OverlayContainer) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.items) {
      this.menuItems = this.mapMenuItems(this.items);
    }
  }

  private mapMenuItems(items: SelectItem2Model[]): MenuItem[] {
    return (items || []).map(item => ({...item, title: item.value, children: this.mapMenuItems(item.children)}));
  }

  public onSelect(items: SelectItem2Model[]) {
    this.selectPath.emit(items);
  }

  public onRemove(event: any) {
    preventEvent(event);
    this.remove.emit();
  }

  public onSelected(menuItemsPath: MenuItem[]) {
    const path = convertMenuItemsPath<SelectItem2Model>(menuItemsPath, this.items);
    if (path.length) {
      this.selectPath.emit(path);
    }
  }

  public onMenuOpened() {
    if (this.stopEventsPropagation) {
      this.mouseDownListener = event => {
        event.stopPropagation();
        event.stopImmediatePropagation();
      };
      this.overlayContainer?.getContainerElement()?.addEventListener('mousedown', this.mouseDownListener);
    }
  }

  public onMenuClosed() {
    if (this.mouseDownListener) {
      this.overlayContainer?.getContainerElement()?.removeEventListener('mousedown', this.mouseDownListener);
    }
  }
}
