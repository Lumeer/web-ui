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
import {KanbanAttribute, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {AttributesResourceType} from '../../../../core/model/resource';

@Pipe({
  name: 'kanbanAggregateSelectItems',
})
export class KanbanAggregateSelectItemsPipe implements PipeTransform {
  public transform(config: KanbanConfig, collections: Collection[]): SelectItemModel[] {
    if (!config || !collections) {
      return [];
    }

    const result: SelectItemModel[] = [];

    let index = 0;
    (config.stemsConfigs || []).forEach(stemConfig => {
      if (stemConfig.attribute && stemConfig.attribute.resourceType === AttributesResourceType.Collection) {
        const collection = collections.find(c => c.id === stemConfig.attribute.resourceId);

        if (collection) {
          result.push(...this.collectionSelectItem(collection, ++index));
        }
      }
    });

    return result;
  }

  private collectionSelectItem(collection: Collection, index: number): SelectItemModel[] {
    return (collection.attributes || []).map(attribute => {
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
}
