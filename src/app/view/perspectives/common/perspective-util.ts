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

import {QueryStem} from '../../../core/store/navigation/query/query';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {GanttChartStemConfig} from '../../../core/store/gantt-charts/gantt-chart';
import {queryStemAttributesResourcesOrder} from '../../../core/store/navigation/query/query.util';
import {findAttribute, getDefaultAttributeId} from '../../../core/store/collections/collection.util';
import {getAttributesResourceType} from '../../../shared/utils/resource.utils';
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {ConstraintType} from '../../../core/model/data/constraint';
import {QueryAttribute} from '../../../core/model/query-attribute';

export function createDefaultNameAndDateRangeConfig(
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): {name?: QueryAttribute; start?: QueryAttribute; end?: QueryAttribute} {
  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  const {index, startAttribute, endAttribute} = findBestDateInitialAttributes(attributesResourcesOrder);
  if (attributesResourcesOrder[index]) {
    const defaultAttributeId = getDefaultAttributeId(attributesResourcesOrder[index]);
    const defaultAttribute = findAttribute(attributesResourcesOrder[index].attributes, defaultAttributeId);
    const resourceId = attributesResourcesOrder[index].id;
    const resourceType = getAttributesResourceType(attributesResourcesOrder[index]);
    const resourceIndex = index;
    const name = defaultAttribute && {attributeId: defaultAttribute.id, resourceId, resourceType, resourceIndex};
    const start = startAttribute && {attributeId: startAttribute.id, resourceId, resourceType, resourceIndex};
    const end = endAttribute && {attributeId: endAttribute.id, resourceId, resourceType, resourceIndex};
    return {name, start, end};
  }

  return {};
}

function findBestDateInitialAttributes(
  attributesResourcesOrder: AttributesResource[]
): {index: number; startAttribute?: Attribute; endAttribute?: Attribute} {
  for (let i = 0; i < (attributesResourcesOrder || []).length; i++) {
    if (getAttributesResourceType(attributesResourcesOrder[i]) !== AttributesResourceType.Collection) {
      continue;
    }

    const dateAttributes = (attributesResourcesOrder[i].attributes || []).filter(
      attribute => attribute.constraint?.type === ConstraintType.DateTime
    );
    if (dateAttributes.length >= 1) {
      return {index: i, startAttribute: dateAttributes[0], endAttribute: dateAttributes[1]};
    }
  }

  return {index: 0};
}
