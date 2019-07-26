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
  GanttChartConfig,
  GanttChartConfigVersion,
  GanttChartMode,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {Query, QueryStem} from '../../../../core/store/navigation/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  collectionIdsChainForStem,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {isArraySubset} from '../../../../shared/utils/array.utils';

export function isGanttConfigChanged(viewConfig: GanttChartConfig, currentConfig: GanttChartConfig): boolean {
  if (viewConfig.mode !== currentConfig.mode) {
    return true;
  }

  return ganttConfigCollectionsChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || []);
}

function ganttConfigCollectionsChanged(c1: GanttChartStemConfig[], c2: GanttChartStemConfig[]): boolean {
  if (c1.length !== c2.length) {
    return true;
  }

  return c1.some((config, index) => ganttConfigCollectionChanged(config, c2[index]));
}

function ganttConfigCollectionChanged(config1: GanttChartStemConfig, config2: GanttChartStemConfig): boolean {
  if (Object.keys(config1.barsProperties).length !== Object.keys(config2.barsProperties).length) {
    return true;
  }

  return Object.entries(config1.barsProperties).some(([key, value]) => {
    return !config2.barsProperties[key] || !deepObjectsEquals(value, config2.barsProperties[key]);
  });
}

export function checkOrTransformGanttConfig(
  config: GanttChartConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartConfig {
  if (!config) {
    return createDefaultConfig(query);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformGanttStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

function checkOrTransformGanttStemsConfig(
  stemsConfigs: GanttChartStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartStemConfig[] {
  if (!stemsConfigs) {
    return stemsConfigs;
  }

  const stemsConfigsCopy = [...stemsConfigs];
  return ((query && query.stems) || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, []);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformGanttStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
}

function findBestStemConfigIndex(
  stemsConfigs: GanttChartStemConfig[],
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

function checkOrTransformGanttStemConfig(
  stemConfig: GanttChartStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartStemConfig {
  if (!stemConfig || !stemConfig.barsProperties) {
    return createDefaultGanttChartStemConfig(stem);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  const barsProperties = Object.entries(stemConfig.barsProperties)
    .filter(([, bar]) => !!bar)
    .reduce((map, [type, bar]) => {
      const attributesResource = attributesResourcesOrder[bar.resourceIndex];
      if (
        attributesResource &&
        attributesResource.id === bar.resourceId &&
        getAttributesResourceType(attributesResource) === bar.resourceType
      ) {
        const attribute = findAttribute(attributesResource.attributes, bar.attributeId);
        if (attribute) {
          map[type] = bar;
        }
      } else {
        const newAttributesResourceIndex = attributesResourcesOrder.findIndex(
          ar => ar.id === bar.resourceId && getAttributesResourceType(ar) === bar.resourceType
        );
        if (newAttributesResourceIndex >= 0) {
          const attribute = findAttribute(
            attributesResourcesOrder[newAttributesResourceIndex].attributes,
            bar.attributeId
          );
          if (attribute) {
            map[type] = {...bar, resourceIndex: newAttributesResourceIndex};
          }
        }
      }
      return map;
    }, {});

  return {barsProperties, stem};
}

function createDefaultConfig(query: Query): GanttChartConfig {
  const stems = (query && query.stems) || [];
  const stemsConfigs = stems.map(stem => createDefaultGanttChartStemConfig(stem));
  return {mode: GanttChartMode.Month, version: GanttChartConfigVersion.V1, stemsConfigs: stemsConfigs};
}

export function createDefaultGanttChartStemConfig(stem?: QueryStem): GanttChartStemConfig {
  return {barsProperties: {}, stem};
}

export function ganttConfigIsEmpty(config: GanttChartConfig) {
  return (
    config &&
    config.stemsConfigs.filter(value => Object.values(value.barsProperties || {}).filter(bar => !!bar).length > 0)
      .length === 0
  );
}
