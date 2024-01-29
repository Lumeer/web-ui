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
  LmrPivotAttribute,
  LmrPivotConfig,
  LmrPivotRowColumnAttribute,
  LmrPivotStemConfig,
  LmrPivotValueAttribute,
  createDefaultPivotConfig,
  createDefaultPivotStemConfig,
} from '@lumeer/pivot';

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

export function checkOrTransformPivotConfig(
  config: LmrPivotConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): LmrPivotConfig {
  if (!config) {
    return createDefaultPivotConfig(query);
  }
  return {
    ...config,
    stemsConfigs: checkOrTransformPivotStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

export function checkOrTransformPivotStemsConfig(
  stemsConfigs: LmrPivotStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): LmrPivotStemConfig[] {
  const stemsConfigsCopy = [...stemsConfigs];
  return ((query && query.stems) || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformPivotStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
}

export function checkOrTransformPivotStemConfig(
  config: LmrPivotStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): LmrPivotStemConfig {
  if (!config) {
    return createDefaultPivotStemConfig(stem);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    rowAttributes: checkOrTransformPivotAttributes<LmrPivotRowColumnAttribute>(
      config.rowAttributes,
      attributesResourcesOrder
    ).map(attribute => ({...attribute, showHeader: true})),
    columnAttributes: checkOrTransformPivotAttributes<LmrPivotRowColumnAttribute>(
      config.columnAttributes,
      attributesResourcesOrder
    ),
    valueAttributes: checkOrTransformPivotAttributes<LmrPivotValueAttribute>(
      config.valueAttributes,
      attributesResourcesOrder
    ),
  };
}

function checkOrTransformPivotAttributes<T extends LmrPivotAttribute>(
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
