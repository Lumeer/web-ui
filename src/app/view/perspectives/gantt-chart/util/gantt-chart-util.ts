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
import {deepObjectsEquals, isNullOrUndefined} from '../../../../shared/utils/common.utils';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {AttributesResourceType} from '../../../../core/model/resource';
import {GanttTaskMetadata} from './gantt-chart-converter';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {createDefaultNameAndDateRangeConfig} from '../../common/perspective-util';
import {queryAttributePermissions} from '../../../../core/model/query-attribute';
import {
  createPossibleLinkingDocuments,
  createPossibleLinkingDocumentsByChains,
} from '../../../../shared/utils/data/data-aggregator-util';

export function isGanttConfigChanged(viewConfig: GanttChartConfig, currentConfig: GanttChartConfig): boolean {
  if (isNullOrUndefined(viewConfig) && isNullOrUndefined(currentConfig)) {
    return false;
  }

  if (isNullOrUndefined(viewConfig) !== isNullOrUndefined(currentConfig)) {
    return true;
  }

  if (Boolean(viewConfig.positionSaved) !== Boolean(currentConfig.positionSaved)) {
    return true;
  }

  if (ganttStemsConfigsChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || [])) {
    return true;
  }

  if (
    !deepObjectsEquals(
      {...viewConfig, stemsConfigs: null, position: null},
      {
        ...currentConfig,
        stemsConfigs: null,
        position: null,
      }
    )
  ) {
    return true;
  }

  return false;
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
    return createDefaultGanttChartConfig(query, collections, linkTypes);
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
  const stemsConfigsCopy = [...(stemsConfigs || [])];
  return (query?.stems || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
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
    return createDefaultGanttChartStemConfig(stem, collections, linkTypes);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    start: checkOrTransformQueryAttribute(stemConfig.start, attributesResourcesOrder),
    end: checkOrTransformQueryAttribute(stemConfig.end, attributesResourcesOrder),
    name: checkOrTransformQueryAttribute(stemConfig.name, attributesResourcesOrder),
    progress: checkOrTransformQueryAttribute(stemConfig.progress, attributesResourcesOrder),
    color: checkOrTransformQueryAttribute(stemConfig.color, attributesResourcesOrder),
    categories: (stemConfig.categories || [])
      .map(category => checkOrTransformQueryAttribute(category, attributesResourcesOrder))
      .filter(val => !!val),
  };
}

export function createDefaultGanttChartConfig(
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): GanttChartConfig {
  const stems = query?.stems || [];
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
    const config = createDefaultNameAndDateRangeConfig(stem, collections, linkTypes);
    return {stem, ...config};
  }
  return {stem};
}

export function createLinkDocumentsDataNewTask(task: GanttChartTask, otherTasks: GanttChartTask[]): string[] {
  const swimlaneChains = (otherTasks || [])
    .filter(otherTask => tasksHasSameSwimlanes(otherTask, task))
    .map(otherTask => (otherTask.metadata && (<GanttTaskMetadata>otherTask.metadata).dataResourceChain) || []);
  return createPossibleLinkingDocuments(swimlaneChains);
}

function tasksHasSameSwimlanes(task1: GanttChartTask, task2: GanttChartTask): boolean {
  return (task1.swimlanes || []).every((swimlane, index) => {
    const otherSwimlane = (task2.swimlanes || [])[index];
    return swimlane?.value === otherSwimlane?.value;
  });
}

export function createLinkDocumentsData(
  task: GanttChartTask,
  otherTasks: GanttChartTask[],
  linkInstances: LinkInstance[]
): {linkInstanceId?: string; documentId?: string; otherDocumentIds?: string[]} {
  const swimlaneChains = (otherTasks || [])
    .filter(otherTask => tasksHasSameSwimlanes(otherTask, task))
    .map(otherTask => (<GanttTaskMetadata>otherTask.metadata).dataResourceChain);
  const dataResourceChain = (task.metadata && (<GanttTaskMetadata>task.metadata).dataResourceChain) || [];
  return createPossibleLinkingDocumentsByChains(dataResourceChain, swimlaneChains, linkInstances);
}

export function ganttTaskDataResourceId(task: GanttChartTask): string {
  const metadata = task.metadata as GanttTaskMetadata;
  return metadata && (metadata.nameDataId || metadata.startDataId);
}

export function ganttTaskBarModel(task: GanttChartTask): GanttChartBarModel {
  const metadata = task.metadata as GanttTaskMetadata;
  return metadata && metadata.stemConfig && (metadata.stemConfig.name || metadata.stemConfig.start);
}

export function canCreateTaskByStemConfig(
  config: GanttChartStemConfig,
  permissions: Record<string, AllowedPermissions>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (!config.start || !config.end) {
    return false;
  }

  const maxDistance = 1;
  if (config.name) {
    return (
      ganttModelsAreAtDistance(config.name, config.start, maxDistance) &&
      ganttModelsAreAtDistance(config.name, config.end, maxDistance) &&
      ganttModelsAreAtDistance(config.start, config.end, maxDistance) &&
      hasPermissionByConfig(config, permissions, linkTypesMap)
    );
  }

  return (
    ganttModelsAreAtDistance(config.start, config.end, maxDistance) &&
    hasPermissionByConfig(config, permissions, linkTypesMap)
  );
}

function hasPermissionByConfig(
  config: GanttChartStemConfig,
  permissions: Record<string, AllowedPermissions>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  let hasPermission = true;
  if (config.name) {
    const permission = queryAttributePermissions(config.name, permissions, linkTypesMap);
    hasPermission = hasPermission && permission && permission.writeWithView;
  }

  if (config.start) {
    const permission = queryAttributePermissions(config.start, permissions, linkTypesMap);
    hasPermission = hasPermission && permission.writeWithView;
  }

  if (config.end) {
    const permission = queryAttributePermissions(config.end, permissions, linkTypesMap);
    hasPermission = hasPermission && permission.writeWithView;
  }

  return hasPermission;
}

function ganttModelsAreAtDistance(
  model1: GanttChartBarModel,
  model2: GanttChartBarModel,
  maxDistance: number
): boolean {
  return Math.abs(model1.resourceIndex - model2.resourceIndex) / 2 <= maxDistance;
}

export function ganttModelsAreFromSameOrNearResource(
  model1: GanttChartBarModel,
  model2: GanttChartBarModel,
  maxDistance = 0
): boolean {
  return ganttModelsAreFromSameResource(model1, model2, maxDistance) || ganttModelsAreFromNearResource(model1, model2);
}

function ganttModelsAreFromSameResource(
  model1: GanttChartBarModel,
  model2: GanttChartBarModel,
  maxDistance = 0
): boolean {
  return (
    model1.resourceType === model2.resourceType &&
    Math.abs(model1.resourceIndex - model2.resourceIndex) / 2 <= maxDistance
  );
}

function ganttModelsAreFromNearResource(model1: GanttChartBarModel, model2: GanttChartBarModel): boolean {
  if (
    model2.resourceType === AttributesResourceType.Collection &&
    model1.resourceType === AttributesResourceType.LinkType &&
    model2.resourceIndex === model1.resourceIndex + 1
  ) {
    return true;
  }

  if (
    model2.resourceType === AttributesResourceType.LinkType &&
    model1.resourceType === AttributesResourceType.Collection &&
    model2.resourceIndex === model1.resourceIndex - 1
  ) {
    return true;
  }

  return false;
}
