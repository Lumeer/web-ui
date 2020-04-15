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
import {QueryStem} from '../../core/store/navigation/query/query';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResourceType} from '../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../core/store/navigation/query/query.util';
import {SelectItemModel} from '../select/select-item/select-item.model';
import {GanttChartBarModel} from '../../core/store/gantt-charts/gantt-chart';

@Pipe({
  name: 'queryStemAttributesSelectItems',
})
export class QueryStemAttributesSelectItemsPipe implements PipeTransform {
  public transform(stem: QueryStem, collections: Collection[], linkTypes: LinkType[]): SelectItemModel[] {
    if (!stem) {
      return [];
    }

    const resources = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
    const items = [];
    for (let i = 0; i < resources.length; i++) {
      if (i % 2 === 0) {
        // collection
        items.push(...this.collectionSelectItem(resources[i] as Collection, i));
      } else {
        // linkType
        items.push(
          ...this.linkTypeSelectItem(
            resources[i] as LinkType,
            resources[i - 1] as Collection,
            resources[i + 1] as Collection,
            i
          )
        );
      }
    }

    return items;
  }

  private collectionSelectItem(collection: Collection, index: number): SelectItemModel[] {
    return (collection.attributes || []).map(attribute => {
      const id: GanttChartBarModel = {
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
      const id: GanttChartBarModel = {
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
