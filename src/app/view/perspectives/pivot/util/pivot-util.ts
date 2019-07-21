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
import {queryStemAttributesResourcesOrder} from '../../../../core/store/navigation/query.util';
import {AttributesResource} from '../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';

export function pivotAttributesAreSame(a1: PivotAttribute, a2: PivotAttribute): boolean {
  return (
    a1.resourceId === a2.resourceId &&
    a1.resourceIndex === a2.resourceIndex &&
    a1.attributeId === a2.attributeId &&
    a1.resourceType === a2.resourceType
  );
}

export function pivotConfigHasDataTransformChange(c1: PivotConfig, c2: PivotConfig): boolean {
  const c1StemsConfigs = c1.stemsConfigs || [];
  const c2StemsConfigs = c2.stemsConfigs || [];
  const maxIndex = Math.max(c1StemsConfigs.length, c2StemsConfigs.length);
  for (let i = 0; i < maxIndex; i++) {
    if (pivotStemConfigHasDataTransformChange(c1StemsConfigs[i], c2StemsConfigs[i])) {
      return true;
    }
  }
  return false;
}

export function pivotStemConfigHasDataTransformChange(c1: PivotStemConfig, c2: PivotStemConfig): boolean {
  if (!c1 && !c2) {
    return false;
  }
  if ((!c1 && c2) || (c1 && !c2)) {
    return true;
  }

  const c1RowAttributes = (c1.rowAttributes || []).map(a => cleanPivotHeaderAttribute(a));
  const c2RowAttributes = (c2.rowAttributes || []).map(a => cleanPivotHeaderAttribute(a));
  if (JSON.stringify(c1RowAttributes) !== JSON.stringify(c2RowAttributes)) {
    return true;
  }

  const c1ColumnAttributes = (c1.columnAttributes || []).map(a => cleanPivotHeaderAttribute(a));
  const c2ColumnAttributes = (c2.columnAttributes || []).map(a => cleanPivotHeaderAttribute(a));
  if (JSON.stringify(c1ColumnAttributes) !== JSON.stringify(c2ColumnAttributes)) {
    return true;
  }

  const c1ValueAttributes = (c1.valueAttributes || []).map(a => cleanPivotValueAttribute(a));
  const c2ValueAttributes = (c2.valueAttributes || []).map(a => cleanPivotValueAttribute(a));

  return JSON.stringify(c1ValueAttributes) !== JSON.stringify(c2ValueAttributes);
}

function cleanPivotHeaderAttribute(pivotRowColumnAttribute: PivotRowColumnAttribute): PivotRowColumnAttribute {
  return {...cleanPivotAttribute(pivotRowColumnAttribute), constraint: pivotRowColumnAttribute.constraint};
}

function cleanPivotValueAttribute(pivotValueAttribute: PivotValueAttribute): PivotValueAttribute {
  return {...cleanPivotAttribute(pivotValueAttribute), aggregation: pivotValueAttribute.aggregation};
}

export function cleanPivotAttribute(attribute: PivotAttribute): PivotAttribute {
  return {
    resourceIndex: attribute.resourceIndex,
    attributeId: attribute.attributeId,
    resourceId: attribute.resourceId,
    resourceType: attribute.resourceType,
  };
}

export function pivotStemConfigHasAdditionalValueLevel(config: PivotStemConfig): boolean {
  const columnsNum = (config.columnAttributes || []).length;
  const valuesNum = (config.valueAttributes || []).length;
  return (columnsNum === 0 && valuesNum > 0) || (columnsNum > 0 && valuesNum > 1);
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

  const stemsConfigs = ((query && query.stems) || []).map((stem, index) =>
    checkOrTransformPivotStemConfig((config.stemsConfigs || [])[index], stem, collections, linkTypes)
  );
  return {...config, stemsConfigs};
}

export function checkOrTransformPivotStemConfig(
  config: PivotStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): PivotStemConfig {
  if (!config) {
    return createDefaultStemConfig();
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
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
  const stemsConfigs = stems.map(() => createDefaultStemConfig());
  return {version: PivotConfigVersion.V1, stemsConfigs: stemsConfigs, mergeTables: true};
}

function createDefaultStemConfig(): PivotStemConfig {
  return {rowAttributes: [], columnAttributes: [], valueAttributes: []};
}

export function pivotConfigIsEmpty(config: PivotConfig): boolean {
  return (config.stemsConfigs || []).every(stemConfig => pivotStemConfigIsEmpty(stemConfig));
}

function pivotStemConfigIsEmpty(config: PivotStemConfig): boolean {
  return (
    ((config && config.rowAttributes) || []).length === 0 &&
    ((config && config.columnAttributes) || []).length === 0 &&
    ((config && config.valueAttributes) || []).length === 0
  );
}
