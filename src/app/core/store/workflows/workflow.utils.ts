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

import {WorkflowConfig, WorkflowConfigVersion, WorkflowResource, WorkflowStemConfig} from './workflow';
import {Query, QueryStem} from '../navigation/query/query';
import {AttributesResourceType} from '../../model/resource';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  checkOrTransformQueryResource,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../navigation/query/query.util';

export function isWorkflowConfigChanged(
  previousConfig: WorkflowConfig,
  currentConfig: WorkflowConfig,
  query: Query
): boolean {
  return !deepObjectsEquals(
    createDefaultWorkflowConfig(previousConfig, query),
    createDefaultWorkflowConfig(currentConfig, query)
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
  return (query?.stems || []).reduce((newConfigs, stem) => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    if (stemConfig?.[0]?.resource) {
      newConfigs.push(checkOrTransformWorkflowStemConfig(stemConfig[0], stem, collections, linkTypes));
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
    resource: checkOrTransformQueryResource(stemConfig.resource, attributesResourcesOrder),
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
    return {stemsConfigs: [{stem, resource}], version: WorkflowConfigVersion.V1};
  }

  return {stemsConfigs: [], version: WorkflowConfigVersion.V1};
}

export function createDefaultWorkflowConfig(config: WorkflowConfig, query: Query): WorkflowConfig {
  if (config?.stemsConfigs?.length) {
    return config;
  }
  const stem = query.stems?.[0];
  if (stem) {
    const resource: WorkflowResource = {
      resourceId: stem.collectionId,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
    };
    return {...config, stemsConfigs: [{stem, resource}], version: WorkflowConfigVersion.V1};
  }

  return {stemsConfigs: [], version: WorkflowConfigVersion.V1};
}
