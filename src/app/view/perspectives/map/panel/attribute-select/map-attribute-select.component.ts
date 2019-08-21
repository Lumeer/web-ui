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
import {Collection} from '../../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'map-attribute-select',
  templateUrl: './map-attribute-select.component.html',
  styleUrls: ['./map-attribute-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapAttributeSelectComponent implements OnChanges {
  @Input()
  public attributeId: string;

  @Input()
  public collection: Collection;

  @Output()
  public select = new EventEmitter<string>();

  public items: SelectItemModel[];

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.collection && this.collection) {
      this.items = this.createSelectItems();
    }
  }

  private createSelectItems(): SelectItemModel[] {
    return this.collection.attributes.map(attribute => ({id: attribute.id, value: attribute.name}));
  }

  public onSelect(attributeId: string) {
    this.select.emit(attributeId);
  }

  public onRemove() {
    this.select.emit(null);
  }
}
