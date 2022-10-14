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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {QueryItem} from './model/query-item';
import {FormGroup} from '@angular/forms';
import {ConstraintData} from '@lumeer/data-filters';
import {QueryItemType} from './model/query-item-type';

@Component({
  selector: 'query-item',
  templateUrl: './query-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'mw-100'},
})
export class QueryItemComponent {
  @Input()
  public queryItem: QueryItem;

  @Input()
  public queryItemForm: FormGroup;

  @Input()
  public readonly: boolean;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public remove = new EventEmitter();

  @Output()
  public change = new EventEmitter();

  @Output()
  public focusInput = new EventEmitter();

  @Output()
  public stemToggle = new EventEmitter<string>();

  @Output()
  public stemTextChange = new EventEmitter<{stemId: string; text: string}>();

  @Output()
  public stemQueryItemAdd = new EventEmitter<{stemId: string; item: QueryItem}>();

  public readonly queryItemType = QueryItemType;

  public onTextChange(text: string) {
    this.stemTextChange.emit({stemId: this.queryItem.stemId, text});
  }

  public onQueryItemAdd(item: QueryItem) {
    this.stemQueryItemAdd.emit({stemId: this.queryItem.stemId, item});
  }
}
