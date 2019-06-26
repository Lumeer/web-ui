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
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {cleanPivotAttribute} from '../util/pivot-util';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';

@Pipe({
  name: 'pivotAttributeSelectItem',
})
export class PivotAttributeSelectItemPipe implements PipeTransform {
  public transform(
    pivotAttribute: PivotRowColumnAttribute,
    attributesResources: AttributesResource[]
  ): SelectItemModel {
    const resource = attributesResources[pivotAttribute.resourceIndex];
    if (!resource || pivotAttribute.resourceId !== resource.id) {
      return null;
    }

    const cleanedAttribute = cleanPivotAttribute(pivotAttribute);
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
      const collection = resource as Collection;
      const attribute = findAttribute(collection.attributes, pivotAttribute.attributeId);
      return (
        attribute && {
          id: cleanedAttribute,
          value: attribute.name,
          icons: [collection.icon],
          iconColors: [collection.color],
        }
      );
    } else if (resourceType === AttributesResourceType.LinkType) {
      const linkType = resource as LinkType;
      const attribute = findAttribute(linkType.attributes, pivotAttribute.attributeId);
      return (
        attribute &&
        linkType.collections &&
        linkType.collections.length === 2 && {
          id: cleanedAttribute,
          value: attribute.name,
          icons: [linkType.collections[0].icon, linkType.collections[1].icon],
          iconColors: [linkType.collections[1].color, linkType.collections[1].color],
        }
      );
    }

    return null;
  }
}
