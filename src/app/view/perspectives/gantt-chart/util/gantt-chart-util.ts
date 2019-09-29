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
  GanttChartBarModel,
  GanttChartConfig,
  GanttChartConfigVersion,
  GanttChartMode,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {AttributesResource} from '../../../../core/model/resource';

export function isGanttConfigChanged(viewConfig: GanttChartConfig, currentConfig: GanttChartConfig): boolean {
  if (!deepObjectsEquals({...viewConfig, stemsConfigs: null}, {...currentConfig, stemsConfigs: null})) {
    return true;
  }

  return ganttStemsConfigsChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || []);
}

function ganttStemsConfigsChanged(c1: GanttChartStemConfig[], c2: GanttChartStemConfig[]): boolean {
  if (c1.length !== c2.length) {
    return true;
  }

  return c1.some((config, index) => ganttStemConfigChanged(config, c2[index]));
}

function ganttStemConfigChanged(config1: GanttChartStemConfig, config2: GanttChartStemConfig): boolean {
  const config1DefinedProperties = ganttStemConfigDefinedProperties(config1);
  const config2DefinedProperties = ganttStemConfigDefinedProperties(config2);
  if (config1DefinedProperties.length !== config2DefinedProperties.length) {
    return true;
  }

  const config2Properties = ganttStemConfigProperties(config2);
  return ganttStemConfigProperties(config1).some((bar, index) => {
    return !deepObjectsEquals(bar, config2Properties[index]);
  });
}

function ganttStemConfigProperties(config: GanttChartStemConfig): GanttChartBarModel[] {
  return [config.start, config.end, config.name, config.color, config.progress, ...(config.categories || [])];
}

function ganttStemConfigDefinedProperties(config: GanttChartStemConfig): GanttChartBarModel[] {
  return ganttStemConfigProperties(config).filter(bar => !!bar);
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

function checkOrTransformGanttStemConfig(
  stemConfig: GanttChartStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartStemConfig {
  if (!stemConfig) {
    return createDefaultGanttChartStemConfig(stem);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    start: checkOrTransformGanttBarModel(stemConfig.start, attributesResourcesOrder),
    end: checkOrTransformGanttBarModel(stemConfig.end, attributesResourcesOrder),
    name: checkOrTransformGanttBarModel(stemConfig.name, attributesResourcesOrder),
    progress: checkOrTransformGanttBarModel(stemConfig.progress, attributesResourcesOrder),
    color: checkOrTransformGanttBarModel(stemConfig.color, attributesResourcesOrder),
    categories: (stemConfig.categories || [])
      .map(category => checkOrTransformGanttBarModel(category, attributesResourcesOrder))
      .filter(val => !!val),
  };
}

function checkOrTransformGanttBarModel(
  bar: GanttChartBarModel,
  attributesResourcesOrder: AttributesResource[]
): GanttChartBarModel {
  if (!bar) {
    return bar;
  }

  const attributesResource = attributesResourcesOrder[bar.resourceIndex];
  if (
    attributesResource &&
    attributesResource.id === bar.resourceId &&
    getAttributesResourceType(attributesResource) === bar.resourceType
  ) {
    const attribute = findAttribute(attributesResource.attributes, bar.attributeId);
    if (attribute) {
      return bar;
    }
  } else {
    const newAttributesResourceIndex = attributesResourcesOrder.findIndex(
      ar => ar.id === bar.resourceId && getAttributesResourceType(ar) === bar.resourceType
    );
    if (newAttributesResourceIndex >= 0) {
      const attribute = findAttribute(attributesResourcesOrder[newAttributesResourceIndex].attributes, bar.attributeId);
      if (attribute) {
        return {...bar, resourceIndex: newAttributesResourceIndex};
      }
    }
  }
  return null;
}

function createDefaultConfig(query: Query): GanttChartConfig {
  const stems = (query && query.stems) || [];
  const stemsConfigs = stems.map(stem => createDefaultGanttChartStemConfig(stem));
  return {
    mode: GanttChartMode.Month,
    version: GanttChartConfigVersion.V2,
    stemsConfigs: stemsConfigs,
    lockResize: true,
  };
}

export function createDefaultGanttChartStemConfig(stem?: QueryStem): GanttChartStemConfig {
  return {stem};
}

export function ganttConfigIsEmpty(config: GanttChartConfig) {
  return config && config.stemsConfigs.filter(value => ganttStemConfigDefinedProperties(value).length > 0).length === 0;
}
