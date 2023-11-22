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
import {cleanQueryAttribute} from '@lumeer/data-filters';
import {deepObjectsEquals} from '@lumeer/utils';

import {AttributesResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {
  checkOrTransformQueryAttribute,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {
  PivotAttribute,
  PivotConfig,
  PivotConfigVersion,
  PivotRowColumnAttribute,
  PivotStemConfig,
  PivotValueAttribute,
} from '../../../../core/store/pivots/pivot';

export function pivotAttributesAreSame(a1: PivotAttribute, a2: PivotAttribute): boolean {
  return deepObjectsEquals(cleanQueryAttribute(a1), cleanQueryAttribute(a2));
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

export function checkOrTransformPivotConfig(
  config: PivotConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): PivotConfig {
  if (!config) {
    return createDefaultPivotConfig(query);
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
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformPivotStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
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

  return pivotAttributes
    .map(pivotAttribute => checkOrTransformQueryAttribute(pivotAttribute, attributesResourcesOrder))
    .filter(attribute => !!attribute);
}

export function createDefaultPivotConfig(query: Query): PivotConfig {
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
