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
  latestWorkflowVersion,
  WorkflowColumnsSettings,
  WorkflowConfig,
  WorkflowResource,
  WorkflowStemConfig,
  WorkflowTableConfig,
} from './workflow';
import {Query, QueryStem} from '../navigation/query/query';
import {AttributesResourceType} from '../../model/resource';
import {deepObjectCopy, deepObjectsEquals} from '../../../shared/utils/common.utils';
import {Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  checkOrTransformQueryResource,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
  queryStemsAreSame,
  queryStemWithoutFilters,
} from '../navigation/query/query.util';

export function isWorkflowConfigChanged(previousConfig: WorkflowConfig, currentConfig: WorkflowConfig): boolean {
  const previous = createWorkflowSaveConfig(previousConfig);
  const current = createWorkflowSaveConfig(currentConfig);

  if (workflowStemsConfigsChanged(previous?.stemsConfigs || [], current?.stemsConfigs || [])) {
    return true;
  }

  if (!deepObjectsEquals(previous?.columns, current?.columns)) {
    return true;
  }

  if (!deepObjectsEquals(previous?.tables, current?.tables)) {
    return true;
  }

  return false;
}

function workflowStemsConfigsChanged(c1: WorkflowStemConfig[], c2: WorkflowStemConfig[]): boolean {
  if (c1.length !== c2.length) {
    return true;
  }

  return c1.some((config, index) => workflowStemConfigsChanged(config, c2[index]));
}

function workflowStemConfigsChanged(c1: WorkflowStemConfig, c2: WorkflowStemConfig): boolean {
  return (
    !queryStemsAreSame(c1.stem, c2.stem) ||
    !deepObjectsEquals(c1.collection, c2.collection) ||
    !deepObjectsEquals(c1.attribute, c2.attribute)
  );
}

export function checkOrTransformWorkflowConfig(
  config: WorkflowConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): WorkflowConfig {
  if (!config) {
    return createDefaultConfig(query);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformWorkflowStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

function checkOrTransformWorkflowStemsConfig(
  stemsConfigs: WorkflowStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): WorkflowStemConfig[] {
  const stemsConfigsCopy = [...stemsConfigs];
  return (query?.stems || []).reduce<WorkflowStemConfig[]>((newConfigs, stem) => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    if (stemConfig?.[0]?.collection) {
      newConfigs.push(checkOrTransformWorkflowStemConfig(stemConfig[0], stem, collections, linkTypes));
    } else {
      newConfigs.push({
        stem: queryStemWithoutFilters(stem),
        collection: {resourceId: stem.collectionId, resourceIndex: 0, resourceType: AttributesResourceType.Collection},
      });
    }
    return newConfigs;
  }, []);
}

function checkOrTransformWorkflowStemConfig(
  stemConfig: WorkflowStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): WorkflowStemConfig {
  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    ...stemConfig,
    stem: queryStemWithoutFilters(stem),
    collection: checkOrTransformQueryResource(stemConfig.collection, attributesResourcesOrder),
    attribute: checkOrTransformQueryAttribute(stemConfig.attribute, attributesResourcesOrder),
  };
}

function createDefaultConfig(query: Query): WorkflowConfig {
  const stem = query.stems?.[0];
  if (stem) {
    const resource: WorkflowResource = {
      resourceId: stem.collectionId,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
    };
    return {stemsConfigs: [{stem, collection: resource}], version: latestWorkflowVersion, columns: {}, tables: []};
  }

  return {stemsConfigs: [], version: latestWorkflowVersion, columns: {}, tables: []};
}

export function createWorkflowSaveConfig(config: WorkflowConfig): WorkflowConfig {
  return (
    config && {
      ...config,
      tables: cleanWorkflowTables(config),
      columns: cleanWorkflowColumns(config),
    }
  );
}

function cleanWorkflowTables(config: WorkflowConfig): WorkflowTableConfig[] {
  return config.tables?.filter(table =>
    config.stemsConfigs.some(
      stemConfig =>
        queryStemsAreSame(table.stem, stemConfig.stem) && table.collectionId === stemConfig.collection?.resourceId
    )
  );
}

function cleanWorkflowColumns(config: WorkflowConfig): WorkflowColumnsSettings {
  const showingCollectionIds =
    config.stemsConfigs?.map(stemConfig => stemConfig.collection?.resourceId).filter(collectionId => !!collectionId) ||
    [];
  const showingLinkTypeIds =
    config.stemsConfigs
      ?.filter(stemConfig => stemConfig.attribute?.resourceType === AttributesResourceType.LinkType)
      .map(stemConfig => stemConfig.attribute.resourceId) || [];

  const columns = deepObjectCopy(config.columns || {});
  Object.keys(columns.collections || {}).forEach(collectionId => {
    if (!showingCollectionIds.includes(collectionId)) {
      delete columns.collections[collectionId];
    }
  });

  Object.keys(columns.linkTypes || {}).forEach(linkTypeId => {
    if (!showingLinkTypeIds.includes(linkTypeId)) {
      delete columns.linkTypes[linkTypeId];
    }
  });

  return columns;
}

export function filterUniqueWorkflowConfigStems(config: WorkflowConfig): WorkflowStemConfig[] {
  return (config.stemsConfigs || []).reduce<WorkflowStemConfig[]>((stemsConfigs, currentConfig) => {
    if (!stemsConfigs.some(stemConfig => queryStemsAreSame(stemConfig.stem, currentConfig.stem))) {
      stemsConfigs.push(currentConfig);
    }
    return stemsConfigs;
  }, []);
}
