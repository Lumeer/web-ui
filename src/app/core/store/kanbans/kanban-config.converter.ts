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

export function convertKanbanConfigDtoToModel(config: any): KanbanConfig {
  if (!config) {
    return config;
  }
  switch (config.version) {
    case KanbanConfigVersion.V1:
      return convertKanbanConfigDtoToModelV1(config);
    default:
      return convertKanbanConfigDtoToModelV0(config);
  }
}

function convertKanbanConfigDtoToModelV1(config: KanbanConfig): KanbanConfig {
  return config;
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

  const attributeId =
    (column.createdFromAttributes || []).length === 1 ? column.createdFromAttributes[0].attributeId : null;
  return {
    ...column,
    resourcesOrder: (column.documentsIdsOrder || []).map(id => ({
      id,
      attributeId,
      resourceType: AttributesResourceType.Collection,
    })),
    createdFromAttributes: (column.createdFromAttributes || []).map(attribute => ({
      ...attribute,
      resourceId: attribute.collectionId,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
    })),
    summary: null,
  };
}
