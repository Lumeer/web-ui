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
import {QueryStem} from '../../../../core/store/navigation/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemWithConstraintId} from '../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {queryStemAttributesResourcesOrder} from '../../../../core/store/navigation/query.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {AttributesResourceType} from '../../../../core/model/resource';

@Pipe({
  name: 'kanbanRestrictedSelectItemIds',
})
export class KanbanRestrictedSelectItemIdsPipe implements PipeTransform {
  public transform(stem: QueryStem, collections: Collection[], linkTypes: LinkType[]): SelectItemWithConstraintId[] {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
    return attributesResourcesOrder.reduce((ids, resource, index) => {
      if (getAttributesResourceType(resource) === AttributesResourceType.LinkType) {
        ids.push(...(resource.attributes || []).map(attr => ({resourceIndex: index, attributeId: attr.id})));
      }
      return ids;
    }, []);
  }
}
