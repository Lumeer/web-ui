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

import {
  AttributesResource,
  AttributesResourceType,
  DataResource,
  DataResourceData,
  DataResourceDataValues,
} from '../../core/model/resource';
import {AttributeSortType, ViewSettings} from '../../core/store/views/view';
import {ConstraintData} from '../../core/model/data/constraint';
import {DataValue} from '../../core/model/data-value';
import {Constraint} from '../../core/model/constraint';
import {isArray, objectsByIdMap, objectValues} from './common.utils';
import {Attribute} from '../../core/store/collections/collection';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';

export function sortDataResourcesByViewSettings<T extends DataResource>(
  dataResources: T[],
  type: AttributesResourceType,
  viewSettings: ViewSettings,
  sortDesc?: boolean
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

    if (sortSettings.length) {
      const sortedDataResources = currentDataResources.sort((a, b) => {
        for (const sortSetting of sortSettings) {
          const ascending = sortSetting.sort === AttributeSortType.Ascending;
          const compare =
            a.dataValues?.[sortSetting.attributeId].compareTo(b.dataValues?.[sortSetting.attributeId]) *
            (ascending ? 1 : -1);
          if (compare !== 0) {
            return compare;
          }
        }
        // otherwise sort by creation date
        const value = a.creationDate.getTime() - b.creationDate.getTime();
        return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
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

function groupDocumentsByCollection(documents: DocumentModel[]): Record<string, DocumentModel[]> {
  return (documents || []).reduce((map, document) => {
    if (!map[document.collectionId]) {
      map[document.collectionId] = [];
    }
    map[document.collectionId].push(document);
    return map;
  }, {});
}

function groupLinkInstancesByLinkTypes(linkInstances: LinkInstance[]): Record<string, LinkInstance[]> {
  return (linkInstances || []).reduce((map, document) => {
    if (!map[document.linkTypeId]) {
      map[document.linkTypeId] = [];
    }
    map[document.linkTypeId].push(document);
    return map;
  }, {});
}

const SUGGESTION_MAX_ROWS = 10240;
const SUGGESTION_MAX_VALUES = 128;

export function createSuggestionDataValues<T extends DataValue>(
  dataResources: DataResource[],
  attributeId: string,
  constraint: Constraint,
  flatten: boolean = true
): T[] {
  const dataValuesMap: Record<string, T> = {};
  let count = 0;
  outerLoop: for (let i = 0; i < Math.min((dataResources || []).length, SUGGESTION_MAX_ROWS); i++) {
    const dataResource = dataResources[i];
    const dataResourceDataValue = dataResource.dataValues?.[attributeId];
    const value = dataResourceDataValue.serialize();

    const values = flatten && isArray(value) ? value : [value];
    for (const val of values) {
      const dataValue = <T>constraint.createDataValue(val, dataResourceDataValue?.constraintData);
      const formattedValue = dataValue.format().trim();
      if (formattedValue) {
        if (!dataValuesMap[formattedValue]) {
          count++;
        }
        dataValuesMap[formattedValue] = dataValue;
      }
      if (count >= SUGGESTION_MAX_VALUES) {
        break outerLoop;
      }
    }
  }

  return objectValues(dataValuesMap).sort((a, b) => a.format().localeCompare(b.format()));
}

export function convertDataResourcesDataValuesByResource<T extends DataResource>(
  dataResources: T[],
  attributesResources: AttributesResource[],
  constraintData: ConstraintData,
  type = AttributesResourceType.Collection
): T[] {
  const attributesResourcesMap = objectsByIdMap(attributesResources);
  return dataResources.map(dataResource => {
    const resource =
      type === AttributesResourceType.Collection
        ? attributesResourcesMap[(<any>dataResource).collectionId]
        : attributesResourcesMap[(<any>dataResource).linkTypeId];
    return {
      ...dataResource,
      dataValues: convertDataToDataValues(dataResource.data, resource?.attributes, constraintData),
    };
  });
}

export function convertDataResourcesDataValues(
  dataResources: DataResource[],
  attributes: Attribute[],
  constraintData: ConstraintData
): DataResource[] {
  return (dataResources || []).map(dataResource => {
    const dataValues = convertDataToDataValues(dataResource.data, attributes, constraintData);
    return {...dataResource, dataValues: {...(dataResource.dataValues || {}), ...dataValues}};
  });
}

export function convertDataToDataValues(
  data: DataResourceData,
  attributes: Attribute[],
  constraintData: ConstraintData
): DataResourceDataValues {
  return (attributes || []).reduce(
    (values, attribute) => ({
      ...values,
      [attribute.id]: attribute.constraint?.createDataValue(data[attribute.id], constraintData),
    }),
    {}
  );
}

export function convertDataValuesToData(dataValues: DataResourceDataValues): DataResourceData {
  return Object.keys(dataValues).reduce((obj, key) => ({...obj, [key]: dataValues[key]?.serialize()}), {});
}
