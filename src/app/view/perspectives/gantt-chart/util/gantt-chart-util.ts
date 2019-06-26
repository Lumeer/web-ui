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
  GanttChartCollectionConfig,
  GanttChartConfig,
  GanttChartMode,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {Query, QueryStem} from '../../../../core/store/navigation/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {queryStemAttributesResourcesOrder} from '../../../../core/store/navigation/query.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';

export function isGanttConfigChanged(viewConfig: GanttChartConfig, currentConfig: GanttChartConfig): boolean {
  if (viewConfig.mode !== currentConfig.mode) {
    return true;
  }

  return ganttConfigCollectionsChanged(viewConfig.collections || {}, currentConfig.collections || {});
}

function ganttConfigCollectionsChanged(
  collections1: Record<string, GanttChartCollectionConfig>,
  collections2: Record<string, GanttChartCollectionConfig>
): boolean {
  if (Object.keys(collections1).length !== Object.keys(collections2).length) {
    return true;
  }

  return Object.entries(collections1).some(([key, value]) => {
    return !collections2[key] || ganttConfigCollectionChanged(value, collections2[key]);
  });
}

function ganttConfigCollectionChanged(
  config1: GanttChartCollectionConfig,
  config2: GanttChartCollectionConfig
): boolean {
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
    return createDefaultConfig();
  }

  return {
    ...config,
    collections: checkOrTransformGanttCollectionsConfig(config.collections, query, collections, linkTypes),
  };
}

function checkOrTransformGanttCollectionsConfig(
  collectionsConfig: Record<string, GanttChartCollectionConfig>,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): Record<string, GanttChartCollectionConfig> {
  if (!collectionsConfig) {
    return collectionsConfig;
  }

  return ((query && query.stems) || []).reduce((map, stem, index) => {
    const collectionConfig = collectionsConfig[stem.collectionId] || Object.values(collectionsConfig)[index];
    const ganttChartCollectionConfig = checkOrTransformGanttCollectionConfig(
      collectionConfig,
      stem,
      collections,
      linkTypes
    );
    if (ganttChartCollectionConfig) {
      map[stem.collectionId] = ganttChartCollectionConfig;
    }

    return map;
  }, {});
}

function checkOrTransformGanttCollectionConfig(
  collectionConfig: GanttChartCollectionConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartCollectionConfig {
  if (!collectionConfig || !collectionConfig.barsProperties) {
    return collectionConfig;
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  const barsProperties = Object.entries(collectionConfig.barsProperties)
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

  return {barsProperties};
}

function createDefaultConfig(): GanttChartConfig {
  return {mode: GanttChartMode.Month, collections: {}};
}

export function ganttConfigIsEmpty(config: GanttChartConfig) {
  return (
    config &&
    Object.values(config.collections || {}).filter(
      value => Object.values(value.barsProperties || {}).filter(bar => !!bar).length > 0
    ).length === 0
  );
}
