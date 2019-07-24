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
  PivotAttribute,
  PivotConfig,
  PivotConfigVersion,
  PivotRowColumnAttribute,
  PivotStemConfig,
  PivotValueAttribute,
} from '../../../../core/store/pivots/pivot';
import {Query, QueryStem} from '../../../../core/store/navigation/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  collectionIdsChainForStem,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query.util';
import {AttributesResource} from '../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {isArraySubset} from '../../../../shared/utils/array.utils';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';

export function pivotAttributesAreSame(a1: PivotAttribute, a2: PivotAttribute): boolean {
  return (
    a1.resourceId === a2.resourceId &&
    a1.resourceIndex === a2.resourceIndex &&
    a1.attributeId === a2.attributeId &&
    a1.resourceType === a2.resourceType
  );
}

export function isPivotConfigChanged(viewConfig: PivotConfig, currentConfig: PivotConfig): boolean {
  if (!!viewConfig.mergeTables !== !!currentConfig.mergeTables && (currentConfig.stemsConfigs || []).length > 1) {
    return true;
  }

  return pivotStemConfigsHasChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || []);
}

function pivotStemConfigsHasChanged(s1: PivotStemConfig[], s2: PivotStemConfig[]): boolean {
  if (s1.length !== s2.length) {
    return true;
  }

  return s1.some((stemConfig, index) => pivotStemConfigHasChanged(stemConfig, s2[index]));
}

function pivotStemConfigHasChanged(s1: PivotStemConfig, s2: PivotStemConfig): boolean {
  return (
    !deepObjectsEquals(s1.rowAttributes || [], s2.rowAttributes || []) ||
    !deepObjectsEquals(s1.columnAttributes || [], s2.columnAttributes || []) ||
    !deepObjectsEquals(s1.valueAttributes || [], s2.valueAttributes || [])
  );
}

export function cleanPivotAttribute(attribute: PivotAttribute): PivotAttribute {
  return {
    resourceIndex: attribute.resourceIndex,
    attributeId: attribute.attributeId,
    resourceId: attribute.resourceId,
    resourceType: attribute.resourceType,
  };
}

export function checkOrTransformPivotConfig(
  config: PivotConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): PivotConfig {
  if (!config) {
    return createDefaultConfig(query);
  }
  return {
    ...config,
    stemsConfigs: checkOrTransformPivotStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

export function checkOrTransformPivotStemsConfig(
  stemsConfigs: PivotStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): PivotStemConfig[] {
  const stemsConfigsCopy = [...stemsConfigs];
  return ((query && query.stems) || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, []);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformPivotStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
}

function findBestStemConfigIndex(
  stemsConfigs: PivotStemConfig[],
  collectionIds: string[],
  linkTypes: LinkType[]
): number {
  for (let i = 0; i < stemsConfigs.length; i++) {
    const stemConfigCollectionIds = collectionIdsChainForStem(stemsConfigs[i].stem, linkTypes);
    if (isArraySubset(stemConfigCollectionIds, collectionIds)) {
      return i;
    }
  }
  for (let i = 0; i < stemsConfigs.length; i++) {
    const stemConfigCollectionIds = collectionIdsChainForStem(stemsConfigs[i].stem, linkTypes);
    if (collectionIds[0] === stemConfigCollectionIds[0]) {
      return i;
    }
  }

  return 0;
}

export function checkOrTransformPivotStemConfig(
  config: PivotStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): PivotStemConfig {
  if (!config) {
    return createDefaultPivotStemConfig(stem);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    rowAttributes: checkOrTransformPivotAttributes<PivotRowColumnAttribute>(
      config.rowAttributes,
      attributesResourcesOrder
    ),
    columnAttributes: checkOrTransformPivotAttributes<PivotRowColumnAttribute>(
      config.columnAttributes,
      attributesResourcesOrder
    ),
    valueAttributes: checkOrTransformPivotAttributes<PivotValueAttribute>(
      config.valueAttributes,
      attributesResourcesOrder
    ),
  };
}

function checkOrTransformPivotAttributes<T extends PivotAttribute>(
  pivotAttributes: T[],
  attributesResourcesOrder: AttributesResource[]
): T[] {
  if (!pivotAttributes) {
    return pivotAttributes;
  }

  return pivotAttributes.reduce((array, pivotAttribute) => {
    const attributesResource = attributesResourcesOrder[pivotAttribute.resourceIndex];
    if (
      attributesResource &&
      attributesResource.id === pivotAttribute.resourceId &&
      getAttributesResourceType(attributesResource) === pivotAttribute.resourceType
    ) {
      const attribute = findAttribute(attributesResource.attributes, pivotAttribute.attributeId);
      if (attribute) {
        array.push(pivotAttribute);
      }
    } else {
      const newAttributesResourceIndex = attributesResourcesOrder.findIndex(
        ar => ar.id === pivotAttribute.resourceId && getAttributesResourceType(ar) === pivotAttribute.resourceType
      );
      if (newAttributesResourceIndex >= 0) {
        const attribute = findAttribute(
          attributesResourcesOrder[newAttributesResourceIndex].attributes,
          pivotAttribute.attributeId
        );
        if (attribute) {
          array.push({...pivotAttribute, resourceIndex: newAttributesResourceIndex});
        }
      }
    }

    return array;
  }, []);
}

function createDefaultConfig(query: Query): PivotConfig {
  const stems = (query && query.stems) || [];
  const stemsConfigs = stems.map(stem => createDefaultPivotStemConfig(stem));
  return {version: PivotConfigVersion.V1, stemsConfigs: stemsConfigs, mergeTables: true};
}

export function createDefaultPivotStemConfig(stem?: QueryStem): PivotStemConfig {
  return {stem, rowAttributes: [], columnAttributes: [], valueAttributes: []};
}

export function pivotConfigIsEmpty(config: PivotConfig): boolean {
  return (config.stemsConfigs || []).every(stemConfig => pivotStemConfigIsEmpty(stemConfig));
}

export function pivotStemConfigIsEmpty(config: PivotStemConfig): boolean {
  return (
    ((config && config.rowAttributes) || []).length === 0 &&
    ((config && config.columnAttributes) || []).length === 0 &&
    ((config && config.valueAttributes) || []).length === 0
  );
}
