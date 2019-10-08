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
import {QueryStem} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {queryStemAttributesResourcesOrder} from '../../../../core/store/navigation/query/query.util';
import {AttributesResourceType} from '../../../../core/model/resource';
import {KanbanAttribute} from '../../../../core/store/kanbans/kanban';
import {isNullOrUndefined} from '../../../../shared/utils/common.utils';

@Pipe({
  name: 'kanbanDueDateSelectItems',
})
export class KanbanDueDateSelectItemsPipe implements PipeTransform {
  public transform(
    stem: QueryStem,
    collections: Collection[],
    linkTypes: LinkType[],
    attribute?: KanbanAttribute
  ): SelectItemModel[] {
    if (!stem || !attribute) {
      return [];
    }

    const resourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
    const index = resourcesOrder.findIndex(ar => ar.id === attribute.resourceId);

    if (!isNullOrUndefined(index)) {
      if (attribute.resourceType === AttributesResourceType.Collection) {
        return this.collectionSelectItem(resourcesOrder[index] as Collection, index);
      }

      if (attribute.resourceType === AttributesResourceType.LinkType) {
        return this.linkTypeSelectItem(
          resourcesOrder[index] as LinkType,
          resourcesOrder[index - 1],
          resourcesOrder[index + 1],
          index
        );
      }
    }

    return [];
  }

  private collectionSelectItem(collection: Collection, index: number): SelectItemModel[] {
    return ((collection && collection.attributes) || []).map(attribute => {
      const id: KanbanAttribute = {
        resourceType: AttributesResourceType.Collection,
        resourceId: collection.id,
        resourceIndex: index,
        attributeId: attribute.id,
        constraint: attribute.constraint,
      };
      return {
        id,
        value: attribute.name,
        icons: [collection.icon] as [string],
        iconColors: [collection.color] as [string],
      };
    });
  }

  private linkTypeSelectItem(
    linkType: LinkType,
    previousCollection: Collection,
    nextCollection: Collection,
    index: number
  ): SelectItemModel[] {
    return (linkType.attributes || []).map(attribute => {
      const id: KanbanAttribute = {
        resourceType: AttributesResourceType.LinkType,
        resourceId: linkType.id,
        resourceIndex: index,
        attributeId: attribute.id,
        constraint: attribute.constraint,
      };
      return {
        id,
        value: attribute.name,
        icons: [previousCollection.icon, nextCollection.icon] as [string, string],
        iconColors: [previousCollection.color, nextCollection.color] as [string, string],
      };
    });
  }
}
