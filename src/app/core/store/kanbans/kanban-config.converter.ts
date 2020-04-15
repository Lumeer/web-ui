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

import {KanbanAttribute, KanbanColumn, KanbanConfig, KanbanConfigVersion, KanbanStemConfig} from './kanban';
import {KanbanCollectionConfigV0, KanbanColumnV0, KanbanConfigV0} from './kanban-old';
import {AttributesResourceType} from '../../model/resource';
import {deepObjectCopy, isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {SizeType} from '../../../shared/slider/size/size-type';
import {PostItLayoutType} from '../../../shared/post-it/post-it-layout-type';
import {cleanKanbanAttribute} from '../../../view/perspectives/kanban/util/kanban.util';

export function convertKanbanConfigDtoToModel(config: any): KanbanConfig {
  if (!config) {
    return config;
  }

  const convertedConfig = convertKanbanConfigDtoToModelWithVersion(config);
  return addDefaultValues(convertedConfig);
}

export function convertKanbanConfigDtoToModelWithVersion(config: any): KanbanConfig {
  let version = parseVersion(config);
  let convertedConfig = config;

  while (version !== KanbanConfigVersion.V2) {
    switch (version) {
      case KanbanConfigVersion.V1:
        convertedConfig = convertKanbanConfigDtoToModelV1(convertedConfig);
        break;
      default:
        convertedConfig = convertKanbanConfigDtoToModelV0(convertedConfig);
        break;
    }

    version = parseVersion(convertedConfig);
  }

  return convertedConfig;
}

function addDefaultValues(config: KanbanConfig): KanbanConfig {
  config.columns.forEach(column => delete column['summary']);
  return {
    ...config,
    cardLayout: config?.cardLayout || PostItLayoutType.Half,
    columnSize: config?.columnSize || SizeType.M,
  };
}

function parseVersion(config: any): string {
  return isNotNullOrUndefined(config?.version) ? String(config.version) : '';
}

function convertKanbanConfigDtoToModelV1(config: KanbanConfig): KanbanConfig {
  const aggregation: any = config['aggregation'];
  const configCopy = deepObjectCopy(config);
  if (aggregation) {
    configCopy.stemsConfigs?.forEach(stemConfig => (stemConfig.aggregation = cleanKanbanAttribute(aggregation)));
  }
  configCopy.columns?.forEach(column => {
    delete column['resourcesOrder'];
    delete column['constraintType'];
  });

  if (configCopy.otherColumn) {
    delete configCopy.otherColumn['resourcesOrder'];
    delete configCopy.otherColumn['constraintType'];
  }

  return {...configCopy, version: KanbanConfigVersion.V2};
}

function convertKanbanConfigDtoToModelV0(config: KanbanConfigV0): KanbanConfig {
  const stemConfigsMap: Record<string, KanbanStemConfig> = {};
  for (const [collectionId, collectionConfig] of Object.entries<KanbanCollectionConfigV0>(config.collections || {})) {
    if (!collectionConfig) {
      continue;
    }

    const attribute: KanbanAttribute = {
      resourceId: collectionConfig.attribute.collectionId,
      attributeId: collectionConfig.attribute.attributeId,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
      constraint: collectionConfig.attribute.constraint,
    };

    stemConfigsMap[collectionId] = {attribute, stem: {collectionId}};
  }

  return {
    columns: (config.columns || []).map(column => convertKanbanColumnConfigDtoToModelV0(column)),
    otherColumn: convertKanbanColumnConfigDtoToModelV0(config.otherColumn),
    stemsConfigs: Object.values(stemConfigsMap),
    version: KanbanConfigVersion.V1,
  };
}

function convertKanbanColumnConfigDtoToModelV0(column: KanbanColumnV0): KanbanColumn {
  if (!column) {
    return null;
  }

  return {
    id: column.id,
    title: column.title,
    width: column.width,
    createdFromAttributes: (column.createdFromAttributes || []).map(attribute => ({
      ...attribute,
      resourceId: attribute.collectionId,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
    })),
  };
}
