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
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {MapAttributeModel} from '../../../../../../core/store/maps/map.model';

@Component({
  selector: 'map-attribute-select',
  templateUrl: './map-attribute-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapAttributeSelectComponent implements OnChanges {
  @Input()
  public attributes: MapAttributeModel[];

  @Input()
  public selectItems: SelectItemModel[];

  @Output()
  public attributesChanged = new EventEmitter<MapAttributeModel[]>();

  public selectAttributes: MapAttributeModel[];

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.attributes) {
      this.selectAttributes = [...(this.attributes || []), null];
    }
  }

  public trackByIndex(index: number, model: MapAttributeModel): number {
    return index;
  }

  public onAttributeSelect(index: number, model: MapAttributeModel) {
    const attributes = [...(this.attributes || [])];
    attributes[index] = model;
    this.attributesChanged.emit(attributes);
  }

  public onAttributeRemoved(index: number) {
    const attributes = [...this.attributes];
    attributes.splice(index, 1);
    this.attributesChanged.emit(attributes);
  }
}
