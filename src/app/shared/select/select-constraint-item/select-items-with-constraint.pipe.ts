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
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {SelectItemModel} from '../select-item/select-item.model';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {deepObjectsEquals} from '../../utils/common.utils';
import {getAttributesResourceType} from '../../utils/resource.utils';

@Pipe({
  name: 'selectItemWithConstraint',
})
export class SelectItemWithConstraintPipe implements PipeTransform {
  public transform(
    attributesResources: AttributesResource[],
    restrictedAttributes: {resourceIndex: number; attributeId: string}[]
  ): SelectItemModel[] {
    return (attributesResources || [])
      .reduce((arr, resource, index) => {
        const resourceType = getAttributesResourceType(resource);
        if (resourceType === AttributesResourceType.Collection) {
          return [...arr, ...this.collectionSelectItems(resource as Collection, index)];
        } else if (resourceType === AttributesResourceType.LinkType) {
          return [...arr, ...this.linkTypeSelectItems(resource as LinkType, index)];
        }
        return arr;
      }, [])
      .filter(item => !(restrictedAttributes || []).some(attr => deepObjectsEquals(item.id, attr)));
  }

  public collectionSelectItems(collection: Collection, index: number): SelectItemModel[] {
    return (collection.attributes || []).map(attribute => ({
      id: {resourceIndex: index, attributeId: attribute.id},
      value: attribute.name,
      icons: [collection.icon],
      iconColors: [collection.color],
    }));
  }

  public linkTypeSelectItems(linkType: LinkType, index: number): SelectItemModel[] {
    if (!linkType.collections || linkType.collections.length !== 2) {
      return [];
    }
    return (linkType.attributes || []).map(attribute => ({
      id: {resourceIndex: index, attributeId: attribute.id},
      value: attribute.name,
      icons: [linkType.collections[0].icon, linkType.collections[1].icon],
      iconColors: [linkType.collections[0].color, linkType.collections[1].color],
    }));
  }
}
