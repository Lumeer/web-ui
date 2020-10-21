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

import {AttributesResource, AttributesResourceType, DataResource} from '../../core/model/resource';
import {groupDocumentsByCollection} from '../../core/store/documents/document.utils';
import {groupLinkInstancesByLinkTypes} from '../../core/store/link-instances/link-instance.utils';
import {AttributeSortType, ViewSettings} from '../../core/store/views/view';
import {ConstraintData} from '../../core/model/data/constraint';
import {createAttributesMap} from '../../core/store/collections/collection.util';
import {UnknownConstraint} from '../../core/model/constraint/unknown.constraint';

export function sortDataResourcesByViewSettings<T extends DataResource>(
  dataResources: T[],
  resourcesMap: Record<string, AttributesResource>,
  type: AttributesResourceType,
  viewSettings: ViewSettings,
  constraintData: ConstraintData
): T[] {
  const dataResourcesByResource = groupDataResourceByResource(dataResources, type);
  const viewSettingsAttributes = viewSettings?.attributes;
  const resourcesSettings =
    type === AttributesResourceType.Collection
      ? viewSettingsAttributes?.collections
      : viewSettingsAttributes?.linkTypes || {};
  const resultDataResources = [];

  for (const resourceId of Object.keys(dataResourcesByResource)) {
    const sortSettings = (resourcesSettings?.[resourceId] || []).filter(setting => !!setting.sort);
    const currentDataResources = dataResourcesByResource[resourceId];
    const attributesMap = createAttributesMap(resourcesMap[resourceId].attributes);

    if (sortSettings.length) {
      const sortedDataResources = currentDataResources.sort((a, b) => {
        for (const sortSetting of sortSettings) {
          const ascending = sortSetting.sort === AttributeSortType.Ascending;
          const constraint = attributesMap[sortSetting.attributeId]?.constraint || new UnknownConstraint();
          const compare =
            constraint
              .createDataValue(a.data?.[sortSetting.attributeId], constraintData)
              .compareTo(constraint.createDataValue(b.data?.[sortSetting.attributeId], constraintData)) *
            (ascending ? 1 : -1);
          if (compare !== 0) {
            return compare;
          }
        }
        // otherwise sort by creation date
        const value = a.creationDate.getTime() - b.creationDate.getTime();
        return value !== 0 ? value : a.id.localeCompare(b.id);
      });
      resultDataResources.push(...sortedDataResources);
    } else {
      resultDataResources.push(...currentDataResources);
    }
  }

  return resultDataResources;
}

export function groupDataResourceByResource<T extends DataResource>(
  dataResources: T[],
  type: AttributesResourceType
): Record<string, T[]> {
  if (type === AttributesResourceType.Collection) {
    return <any>groupDocumentsByCollection(<any>dataResources);
  }
  return <any>groupLinkInstancesByLinkTypes(<any>dataResources);
}
