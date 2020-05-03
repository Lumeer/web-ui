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

import {Pipe, PipeTransform} from '@angular/core';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {MapAttributeModel, MapStemConfig} from '../../../../core/store/maps/map.model';
import {mapAttributesAreInAllowedRange} from '../../../../core/store/maps/map-config.utils';

@Pipe({
  name: 'attributeSelectItems',
})
export class AttributeSelectItemsPipe implements PipeTransform {
  public transform(selectItems: SelectItemModel[], attributes: MapAttributeModel[], index: number): SelectItemModel[] {
    if (attributes?.length) {
      const someAttribute = attributes.find((attribute, i) => index !== i && !!attribute);
      return selectItems.filter(selectItem => {
        const model = selectItem.id as MapAttributeModel;
        return mapAttributesAreInAllowedRange(someAttribute, model);
      });
    }
    return selectItems;
  }
}
