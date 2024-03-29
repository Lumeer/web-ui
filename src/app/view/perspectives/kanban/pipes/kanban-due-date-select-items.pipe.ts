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

import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanAttribute, KanbanResource} from '../../../../core/store/kanbans/kanban';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';

@Pipe({
  name: 'kanbanDueDateSelectItems',
})
export class KanbanDueDateSelectItemsPipe implements PipeTransform {
  public transform(attributesResourcesOrder: AttributesResource[], attribute?: KanbanResource): SelectItemModel[] {
    if ((attributesResourcesOrder || []).length === 0) {
      return [];
    }

    const index = attributesResourcesOrder.findIndex(ar => ar.id === attribute.resourceId);

    if (index >= 0) {
      if (attribute.resourceType === AttributesResourceType.Collection) {
        return this.collectionSelectItem(attributesResourcesOrder[index] as Collection, index);
      }

      if (attribute.resourceType === AttributesResourceType.LinkType) {
        return this.linkTypeSelectItem(
          attributesResourcesOrder[index] as LinkType,
          attributesResourcesOrder[index - 1],
          attributesResourcesOrder[index + 1],
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
