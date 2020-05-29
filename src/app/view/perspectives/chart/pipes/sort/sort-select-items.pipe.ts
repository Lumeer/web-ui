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
import {ChartConfig} from '../../../../../core/store/charts/chart';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {collectionAttributeToItem, linkTypeAttributeToItem} from '../axis/pipes.util';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Collection} from '../../../../../core/store/collections/collection';

@Pipe({
  name: 'sortSelectItems',
})
export class SortSelectItemsPipe implements PipeTransform {
  public transform(config: ChartConfig, attributesResources: AttributesResource[]): SelectItemModel[] {
    const xAxis = config.axes?.x?.axis;
    if (!xAxis) {
      return [];
    }

    const collections = (attributesResources || []).filter(
      resource => getAttributesResourceType(resource) === AttributesResourceType.Collection
    ) as Collection[];
    const linkTypes = (attributesResources || []).filter(
      resource => getAttributesResourceType(resource) === AttributesResourceType.LinkType
    ) as LinkType[];

    if (xAxis.resourceType === AttributesResourceType.Collection) {
      const collection = collections.find(coll => xAxis.resourceId === coll.id);
      return (
        (collection &&
          collection.attributes.map(attribute =>
            collectionAttributeToItem(collection, attribute, xAxis.resourceIndex)
          )) ||
        []
      );
    } else if (xAxis.resourceType === AttributesResourceType.LinkType) {
      const linkType = linkTypes.find(lt => xAxis.resourceId === lt.id);
      const collection1 = linkType && collections.find(c => c.id === linkType.collectionIds[0]);
      const collection2 = linkType && collections.find(c => c.id === linkType.collectionIds[1]);
      return (
        (linkType &&
          collection1 &&
          collection2 &&
          linkType.attributes.map(attribute =>
            linkTypeAttributeToItem(linkType, [collection1, collection2], attribute, xAxis.resourceIndex)
          )) ||
        []
      );
    }
    return [];
  }
}
