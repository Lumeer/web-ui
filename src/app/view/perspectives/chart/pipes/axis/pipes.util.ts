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

import {ChartAxis} from '../../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {AttributesResourceType} from '../../../../../core/model/resource';

export function collectionAttributeToItem(
  collection: Collection,
  attribute: Attribute,
  index?: number
): SelectItemModel {
  const axis: ChartAxis = {
    resourceId: collection.id,
    attributeId: attribute.id,
    resourceType: AttributesResourceType.Collection,
    resourceIndex: index,
  };
  return {id: axis, value: attribute.name, icons: [collection.icon], iconColors: [collection.color]};
}

export function linkTypeAttributeToItem(
  linkType: LinkType,
  collections: [Collection, Collection],
  attribute: Attribute,
  index?: number
): SelectItemModel {
  const axis: ChartAxis = {
    resourceId: linkType.id,
    attributeId: attribute.id,
    resourceType: AttributesResourceType.LinkType,
    resourceIndex: index,
  };
  return {
    id: axis,
    value: attribute.name,
    icons: [collections[0].icon, collections[1].icon],
    iconColors: [collections[0].color, collections[1].color],
  };
}
