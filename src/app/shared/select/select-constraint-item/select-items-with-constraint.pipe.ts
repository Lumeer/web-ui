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

import {deepObjectsEquals} from '@lumeer/utils';

import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {SelectItemModel} from '../select-item/select-item.model';

@Pipe({
  name: 'selectItemsWithConstraint',
})
export class SelectItemsWithConstraintPipe implements PipeTransform {
  public transform(
    attributesResources: AttributesResource[],
    restrictedAttributes: {resourceIndex: number; attributeId: string}[]
  ): SelectItemModel[] {
    return (attributesResources || [])
      .reduce((selectItems, resource, index) => {
        const resourceType = getAttributesResourceType(resource);
        if (resourceType === AttributesResourceType.Collection) {
          selectItems.push(...this.collectionSelectItems(resource as Collection, index));
        } else if (resourceType === AttributesResourceType.LinkType) {
          selectItems.push(...this.linkTypeSelectItems(resource as LinkType, index));
        }
        return selectItems;
      }, [])
      .filter(item => !(restrictedAttributes || []).some(attr => deepObjectsEquals(item.id, attr)));
  }

  public collectionSelectItems(collection: Collection, index: number): SelectItemModel[] {
    return (collection?.attributes || []).map(attribute => ({
      id: {resourceIndex: index, attributeId: attribute.id},
      value: attribute.name,
      icons: [collection.icon],
      iconColors: [collection.color],
    }));
  }

  public linkTypeSelectItems(linkType: LinkType, index: number): SelectItemModel[] {
    if (!linkType || !linkType.collections || linkType.collections.length !== 2) {
      return [];
    }
    return (linkType?.attributes || []).map(attribute => ({
      id: {resourceIndex: index, attributeId: attribute.id},
      value: attribute.name,
      icons: [linkType.collections?.[0]?.icon, linkType.collections?.[1]?.icon],
      iconColors: [linkType.collections?.[0]?.color, linkType.collections?.[1]?.color],
    }));
  }
}
