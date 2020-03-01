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
  GANTT_COLUMN_WIDTH,
  GANTT_PADDING,
  GanttChartBarModel,
  GanttChartConfig,
  GanttChartConfigVersion,
  GanttChartMode,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {deepObjectsEquals, findLastIndex} from '../../../../shared/utils/common.utils';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {GanttChartTaskMetadata} from './gantt-chart-converter';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import {getOtherLinkedDocumentId, LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {uniqueValues} from '../../../../shared/utils/array.utils';

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
    return createDefaultConfig(query, collections, linkTypes);
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

function createDefaultConfig(query: Query, collections: Collection[], linkTypes: LinkType[]): GanttChartConfig {
  const stems = (query && query.stems) || [];
  const stemsConfigs = stems.map(stem => createDefaultGanttChartStemConfig(stem, collections, linkTypes));
  return {
    mode: GanttChartMode.Month,
    version: GanttChartConfigVersion.V2,
    stemsConfigs: stemsConfigs,
    lockResize: true,
    columnWidth: GANTT_COLUMN_WIDTH,
    padding: GANTT_PADDING,
  };
}

export function createDefaultGanttChartStemConfig(
  stem?: QueryStem,
  collections?: Collection[],
  linkTypes?: LinkType[]
): GanttChartStemConfig {
  if (stem && collections && linkTypes) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
    const {index, startAttribute, endAttribute} = findBestInitialAttributes(attributesResourcesOrder);
    if (attributesResourcesOrder[index]) {
      const defaultAttributeId = getDefaultAttributeId(attributesResourcesOrder[index]);
      const defaultAttribute = findAttribute(attributesResourcesOrder[index].attributes, defaultAttributeId);
      const resourceId = attributesResourcesOrder[index].id;
      const resourceType = getAttributesResourceType(attributesResourcesOrder[index]);
      const resourceIndex = index;
      const name = defaultAttribute && {attributeId: defaultAttribute.id, resourceId, resourceType, resourceIndex};
      const start = startAttribute && {attributeId: startAttribute.id, resourceId, resourceType, resourceIndex};
      const end = endAttribute && {attributeId: endAttribute.id, resourceId, resourceType, resourceIndex};
      return {stem, name, start, end};
    }

    return {stem};
  }
  return {};
}

function findBestInitialAttributes(
  attributesResourcesOrder: AttributesResource[]
): {index: number; startAttribute?: Attribute; endAttribute?: Attribute} {
  for (let i = 0; i < (attributesResourcesOrder || []).length; i++) {
    if (getAttributesResourceType(attributesResourcesOrder[i]) !== AttributesResourceType.Collection) {
      continue;
    }

    const dateAttributes = (attributesResourcesOrder[i].attributes || []).filter(
      attribute => attribute.constraint && attribute.constraint.type === ConstraintType.DateTime
    );
    if (dateAttributes.length >= 2) {
      return {index: i, startAttribute: dateAttributes[0], endAttribute: dateAttributes[1]};
    }
  }

  return {index: 0};
}

export function ganttConfigIsEmpty(config: GanttChartConfig) {
  return config && config.stemsConfigs.filter(value => ganttStemConfigDefinedProperties(value).length > 0).length === 0;
}

export function cleanGanttBarModel(model: GanttChartBarModel): GanttChartBarModel {
  return {
    resourceIndex: model.resourceIndex,
    attributeId: model.attributeId,
    resourceId: model.resourceId,
    resourceType: model.resourceType,
  };
}

export function createLinkDocumentsData(
  task: GanttChartTask,
  otherTasks: GanttChartTask[],
  linkInstances: LinkInstance[]
): {linkInstanceId?: string; documentId?: string; otherDocumentIds?: string[]} {
  const swimlaneTasks = (otherTasks || []).filter(t => deepObjectsEquals(t.swimlanes, task.swimlanes));
  const dataResourceChain = (<GanttChartTaskMetadata>task.metadata).dataResourceChain || [];
  const linkChainIndex = findLastIndex(dataResourceChain, chain => !!chain.linkInstanceId);
  const linkChain = dataResourceChain[linkChainIndex];
  const linkInstance = linkChain && (linkInstances || []).find(li => li.id === linkChain.linkInstanceId);
  const documentChain = dataResourceChain[linkChainIndex - 1];
  const documentId = getOtherLinkedDocumentId(linkInstance, documentChain && documentChain.documentId);
  if (!linkInstance || !documentId) {
    return {};
  }

  const otherDocumentIds = swimlaneTasks
    .map(swimlaneTask => {
      const swimlaneTaskChain = (<GanttChartTaskMetadata>swimlaneTask.metadata).dataResourceChain;
      const documentToLinkChain = swimlaneTaskChain[linkChainIndex - 1];
      if (documentToLinkChain && documentToLinkChain.documentId && documentToLinkChain.documentId !== documentId) {
        return documentToLinkChain.documentId;
      }
      return null;
    })
    .filter(doc => !!doc);
  return {linkInstanceId: linkChain.linkInstanceId, documentId, otherDocumentIds: uniqueValues(otherDocumentIds)};
}
