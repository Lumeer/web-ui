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

import {preventEvent} from '../../../utils/common.utils';
import {SelectItem2Model, SelectedItemDisplayValue} from '../../select-item2/select-item2.model';

@Component({
  selector: 'select-item-row',
  templateUrl: './select-item-row.component.html',
  styleUrls: ['./select-item-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemRowComponent implements OnChanges {
  @Input()
  public item: SelectItem2Model;

  @Input()
  public removable: boolean;

  @Input()
  public disabled: boolean;

  @Input()
  public displayValue: SelectedItemDisplayValue = SelectedItemDisplayValue.LastChild;

  @Output()
  public remove = new EventEmitter();

  public formattedValue: string;
  public formattedItem: SelectItem2Model;

  public onRemove(event: MouseEvent) {
    preventEvent(event);
    this.remove.emit();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.item || changes.displayValue) {
      this.formatValues();
    }
  }

  private formatValues() {
    switch (this.displayValue) {
      case SelectedItemDisplayValue.LastChild:
        const lastChild = findLastChild(this.item);
        this.formattedItem = lastChild;
        this.formattedValue = lastChild?.value;
        break;
      case SelectedItemDisplayValue.FullPath:
        this.formattedItem = this.item;
        this.formattedValue = this.childrenDisplayValue(this.item);
        break;
      default:
        this.formattedItem = this.item;
        this.formattedValue = this.item?.value;
        break;
    }
  }

  private childrenDisplayValue(item: SelectItem2Model): string {
    if (item?.children?.length) {
      return `${item.value} (${this.childrenDisplayValue(item.children[0])})`;
    }
    return item.value;
  }
}

function findLastChild(item: SelectItem2Model): SelectItem2Model {
  let lastChild = item;
  while (lastChild?.children?.length) {
    lastChild = lastChild?.children?.[0];
  }
  return lastChild;
}
