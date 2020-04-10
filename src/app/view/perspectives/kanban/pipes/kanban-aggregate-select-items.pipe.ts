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
import {KanbanAttribute, KanbanStemConfig} from '../../../../core/store/kanbans/kanban';
import {Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {AttributesResourceType} from '../../../../core/model/resource';
import {LinkType} from '../../../../core/store/link-types/link.type';

@Pipe({
  name: 'kanbanAggregateSelectItems',
})
export class KanbanAggregateSelectItemsPipe implements PipeTransform {
  public transform(config: KanbanStemConfig, collections: Collection[], linkTypes: LinkType[]): SelectItemModel[] {
    if (!config?.attribute) {
      return [];
    }

    if (config.attribute.resourceType === AttributesResourceType.Collection) {
      const collection = (collections || []).find(coll => coll.id === config.attribute.resourceId);
      return this.collectionSelectItem(collection, config.attribute.resourceIndex);
    } else if (config.attribute.resourceType === AttributesResourceType.LinkType) {
      const linkType = (linkTypes || []).find(lt => lt.id === config.attribute.resourceId);
      return this.linkTypeSelectItems(linkType, config.attribute.resourceIndex);
    }
  }

  private collectionSelectItem(collection: Collection, index: number): SelectItemModel[] {
    return (collection?.attributes || []).map(attribute => {
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

  public linkTypeSelectItems(linkType: LinkType, index: number): SelectItemModel[] {
    return (linkType?.attributes || []).map(attribute => ({
      id: {resourceIndex: index, attributeId: attribute.id},
      value: attribute.name,
      icons: [linkType.collections?.[0]?.icon, linkType.collections?.[1]?.icon],
      iconColors: [linkType.collections?.[0]?.color, linkType.collections?.[1]?.color],
    }));
  }
}
