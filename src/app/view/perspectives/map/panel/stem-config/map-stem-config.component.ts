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
import {Collection} from '../../../../../core/store/collections/collection';
import {MapAttributeModel, MapStemConfig} from '../../../../../core/store/maps/map.model';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {mapAttributesAreInAllowedRange} from '../../../../../core/store/maps/map-config.utils';

@Component({
  selector: 'map-stem-config',
  templateUrl: './map-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column'},
})
export class MapStemConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public config: MapStemConfig;

  @Input()
  public stem: QueryStem;

  @Input()
  public selectItems: SelectItemModel[];

  @Output()
  public configChange = new EventEmitter<MapStemConfig>();

  public onColorSelect(model: MapAttributeModel) {
    const configCopy = {...this.config, color: model};
    this.configChange.next(configCopy);
  }

  public onColorRemoved() {
    const configCopy = {...this.config};
    delete configCopy.color;
    this.configChange.next(configCopy);
  }

  public onAttributesChanged(attributes: MapAttributeModel[]) {
    const configCopy = {...this.config, attributes};
    if (configCopy.color && attributes.some(attr => !mapAttributesAreInAllowedRange(attr, configCopy.color))) {
      delete configCopy.color;
    }

    this.configChange.next(configCopy);
  }
}
