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
import {MapAttributeModel} from '../../../../core/store/maps/map.model';
import {mapAttributesAreInAllowedRange} from '../../../../core/store/maps/map-config.utils';
import {deepObjectsEquals} from '@lumeer/utils';
import {cleanQueryAttribute} from '@lumeer/data-filters';

@Pipe({
  name: 'attributeSelectItems',
})
export class AttributeSelectItemsPipe implements PipeTransform {
  public transform(selectItems: SelectItemModel[], attributes: MapAttributeModel[], index: number): SelectItemModel[] {
    if (attributes?.length) {
      const otherAttribute = attributes.find((attribute, i) => index !== i && !!attribute);
      const restrictedAttributes = [...attributes]
        .filter(attribute => !!attribute)
        .map(attribute => cleanQueryAttribute(attribute));
      restrictedAttributes.splice(index, 1);
      return selectItems.filter(selectItem => {
        const model = selectItem.id as MapAttributeModel;
        return (
          mapAttributesAreInAllowedRange(otherAttribute, model) &&
          !restrictedAttributes.some(restrictedAttribute => deepObjectsEquals(restrictedAttribute, model))
        );
      });
    }
    return selectItems;
  }
}
