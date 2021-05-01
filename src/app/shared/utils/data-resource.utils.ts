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
import {
  AttributeSortType,
  AttributesSettings,
  ResourceAttributeSettings,
  ViewSettings,
} from '../../core/store/views/view';
import {isArray, objectsByIdMap, objectValues} from './common.utils';
import {Constraint, ConstraintData, DataValue, UnknownConstraint} from '@lumeer/data-filters';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkType} from '../../core/store/link-types/link.type';
import {composeViewSettingsLinkTypeCollectionId} from '../settings/settings.util';
import {getAttributesResourceType} from './resource.utils';

export function sortDataResourcesByViewSettings<T extends DataResource>(
  dataResources: T[],
  resourcesMap: Record<string, AttributesResource>,
  type: AttributesResourceType,
  attributesSettings: AttributesSettings,
  constraintData: ConstraintData,
  sortDesc?: boolean
): T[] {
  const dataResourcesByResource = groupDataResourceByResource(dataResources, type);
  const resourcesSettings =
    type === AttributesResourceType.Collection ? attributesSettings?.collections : attributesSettings?.linkTypes || {};
  const resultDataResources = [];

  for (const resourceId of Object.keys(dataResourcesByResource)) {
    const sortSettings = (resourcesSettings?.[resourceId] || []).filter(setting => !!setting.sort);
    const currentDataResources = dataResourcesByResource[resourceId];
    const attributesMap = objectsByIdMap(resourcesMap[resourceId].attributes);

    if (sortSettings.length) {
      const sortedDataResources = sortDataResourcesObjects(
        currentDataResources,
        sortSettings,
        attributesMap,
        constraintData,
        sortDesc,
        dataResource => dataResource
      );
      resultDataResources.push(...sortedDataResources);
    } else {
      resultDataResources.push(...currentDataResources);
    }
  }

  return resultDataResources;
}

export function sortDataObjectsByViewSettings<T extends {linkInstance?: LinkInstance; document?: DocumentModel}>(
  dataObjects: T[],
  collection: Collection,
  linkType: LinkType,
  attributesSettings: AttributesSettings,
  constraintData: ConstraintData
): T[] {
  const linkTypeSettings = attributesSettings?.linkTypes?.[linkType?.id];
  const collectionSettings =
    attributesSettings?.linkTypesCollections?.[composeViewSettingsLinkTypeCollectionId(collection?.id, linkType?.id)];

  const linkTypeSortSettings = (linkTypeSettings || []).filter(setting => !!setting.sort);
  const collectionSortSettings = (collectionSettings || []).filter(setting => !!setting.sort);

  const linkTypeAttributesMap = objectsByIdMap(linkType?.attributes);
  const collectionAttributesMap = objectsByIdMap(collection?.attributes);

  return [...(dataObjects || [])].sort((a, b) => {
    if (linkTypeSortSettings.length) {
      const compare = compareDataResourcesObjectsBySort(
        a,
        b,
        linkTypeSortSettings,
        linkTypeAttributesMap,
        constraintData,
        false,
        object => object.linkInstance
      );
      if (compare !== 0) {
        return compare;
      }
    }

    if (collectionSortSettings.length) {
      const compare = compareDataResourcesObjectsBySort(
        a,
        b,
        collectionSortSettings,
        collectionAttributesMap,
        constraintData,
        false,
        object => object.document
      );
      if (compare !== 0) {
        return compare;
      }
    }

    return compareDataResourcesObjectsByCreation(a, b, false, object => object.linkInstance);
  });
}

export function sortDataResourcesObjectsByViewSettings<T>(
  objects: T[],
  viewSettings: ViewSettings,
  collections: Collection[],
  linkTypes: LinkType[],
  constraintData: ConstraintData,
  dataResourceCallback: (T) => DataResource,
  resourceCallback: (T) => AttributesResource,
  defaultSort?: (a: T, b: T) => number
): T[] {
  const collectionAttributesMap = (collections || []).reduce(
    (map, collection) => ({
      ...map,
      [collection.id]: objectsByIdMap(collection?.attributes),
    }),
    []
  );
  const linkTypesAttributesMap = (linkTypes || []).reduce(
    (map, linkType) => ({
      ...map,
      [linkType.id]: objectsByIdMap(linkType?.attributes),
    }),
    []
  );

  const collectionsSortsMap = (collections || []).reduce((map, collection) => {
    map[collection.id] =
      viewSettings?.attributes?.collections?.[collection.id]?.filter(settings => !!settings.sort) || [];
    return map;
  }, {});

  const linkTypesSortsMap = (linkTypes || []).reduce((map, linkType) => {
    map[linkType.id] = viewSettings?.attributes?.linkTypes?.[linkType.id]?.filter(settings => !!settings.sort) || [];
    return map;
  }, {});

  return objects.sort((a, b) => {
    const aResource = resourceCallback(a);
    const bResource = resourceCallback(b);

    if (aResource && bResource && aResource.id === bResource.id) {
      const resourceType = getAttributesResourceType(aResource);
      const attributesMap =
        resourceType === AttributesResourceType.Collection
          ? collectionAttributesMap[aResource.id]
          : linkTypesAttributesMap[aResource.id];
      const sortSettings =
        resourceType === AttributesResourceType.Collection
          ? collectionsSortsMap[aResource.id]
          : linkTypesSortsMap[aResource.id];
      return (
        compareDataResourcesObjectsBySort(
          a,
          b,
          sortSettings,
          attributesMap,
          constraintData,
          false,
          dataResourceCallback
        ) ||
        defaultSort?.(a, b) ||
        compareDataResourcesObjectsByCreation(a, b, false, dataResourceCallback)
      );
    }

    return defaultSort?.(a, b) || 0;
  });
}

export function sortDataResourcesObjects<T>(
  objects: T[],
  sortSettings: ResourceAttributeSettings[],
  attributesMap: Record<string, Attribute>,
  constraintData: ConstraintData,
  sortDesc: boolean,
  dataResourceCallback: (T) => DataResource,
  defaultSort?: (a: T, b: T) => number
): T[] {
  return objects.sort(
    (a, b) =>
      compareDataResourcesObjectsBySort(
        a,
        b,
        sortSettings,
        attributesMap,
        constraintData,
        sortDesc,
        dataResourceCallback
      ) ||
      defaultSort?.(a, b) ||
      compareDataResourcesObjectsByCreation(a, b, sortDesc, dataResourceCallback)
  );
}

export function compareDataResourcesObjectsBySort<T>(
  a: T,
  b: T,
  sortSettings: ResourceAttributeSettings[],
  attributesMap: Record<string, Attribute>,
  constraintData: ConstraintData,
  sortDesc: boolean,
  dataResourceCallback: (T) => DataResource
): number {
  const aDataResource = dataResourceCallback(a);
  const bDataResource = dataResourceCallback(b);
  for (const sortSetting of sortSettings) {
    const ascending = sortSetting.sort === AttributeSortType.Ascending;
    const constraint = attributesMap[sortSetting.attributeId]?.constraint || new UnknownConstraint();
    const compare =
      constraint
        .createDataValue(aDataResource.data?.[sortSetting.attributeId], constraintData)
        .compareTo(constraint.createDataValue(bDataResource.data?.[sortSetting.attributeId], constraintData)) *
      (ascending ? 1 : -1);
    if (compare !== 0) {
      return compare;
    }
  }

  return 0;
}

export function compareDataResourcesObjectsByCreation<T>(
  a: T,
  b: T,
  sortDesc: boolean,
  dataResourceCallback: (T) => DataResource
): number {
  const aDataResource = dataResourceCallback(a);
  const bDataResource = dataResourceCallback(b);

  const value = aDataResource.creationDate?.getTime() - bDataResource.creationDate?.getTime();
  return (value !== 0 ? value : aDataResource.id.localeCompare(bDataResource.id)) * (sortDesc ? -1 : 1);
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

const SUGGESTION_MAX_ROWS = 10240;
const SUGGESTION_MAX_VALUES = 128;

export function createSuggestionDataValues<T extends DataValue>(
  dataResources: DataResource[],
  attributeId: string,
  constraint: Constraint,
  constraintData: ConstraintData,
  flatten: boolean = true
): T[] {
  const dataValuesMap: Record<string, T> = {};
  let count = 0;
  outerLoop: for (let i = 0; i < Math.min((dataResources || []).length, SUGGESTION_MAX_ROWS); i++) {
    const dataResource = dataResources[i];
    const value = dataResource.data?.[attributeId];

    const values = flatten && isArray(value) ? value : [value];
    for (const val of values) {
      const dataValue = <T>constraint.createDataValue(val, constraintData);
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

export function getDataResourceType(dataResource: DataResource): AttributesResourceType {
  if ((<DocumentModel>dataResource)?.collectionId) {
    return AttributesResourceType.Collection;
  } else if ((<LinkInstance>dataResource)?.linkTypeId) {
    return AttributesResourceType.LinkType;
  }
  return null;
}

export function getDataResourceResourceId(dataResource: DataResource): string {
  return (<DocumentModel>dataResource)?.collectionId || (<LinkInstance>dataResource)?.linkTypeId;
}

export function getDataResourcesDataIds(
  dataResources: DataResource[]
): {collectionIds: string[]; linkTypeIds: string[]; documentIds: string[]; linkInstanceIds: string[]} {
  const collectionIds = [];
  const linkTypeIds = [];
  const documentIds = [];
  const linkInstanceIds = [];

  for (const dataResource of dataResources || []) {
    const type = getDataResourceType(dataResource);
    if (type === AttributesResourceType.Collection) {
      collectionIds.push(getDataResourceResourceId(dataResource));
      documentIds.push(dataResource.id);
    } else if (type === AttributesResourceType.LinkType) {
      linkTypeIds.push(getDataResourceResourceId(dataResource));
      linkInstanceIds.push(dataResource.id);
    }
  }
  return {collectionIds, linkTypeIds, linkInstanceIds, documentIds};
}
