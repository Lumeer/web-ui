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

import {KanbanCollectionConfig, KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {areArraysSame} from '../../../../shared/utils/array.utils';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';

export function isKanbanConfigChanged(viewConfig: KanbanConfig, currentConfig: KanbanConfig): boolean {
  if (!deepObjectsEquals(viewConfig.collections, currentConfig.collections)) {
    return true;
  }

  const currentColumns = currentConfig.columns || [];
  return (viewConfig.columns || []).some((column, index) => {
    if (index > currentColumns.length - 1) {
      return true;
    }

    const currentColumn = (currentConfig.columns || [])[index];
    return kanbanColumnsChanged(column, currentColumn);
  });
}

function kanbanColumnsChanged(column1: KanbanColumn, column2: KanbanColumn): boolean {
  return (
    !deepObjectsEquals(column1, column2) ||
    !areArraysSame(column1 && column1.documentsIdsOrder, column2 && column2.documentsIdsOrder)
  );
}

export function checkOrTransformKanbanConfig(config: KanbanConfig, collections: Collection[]): KanbanConfig {
  if (!config) {
    return createDefaultConfig();
  }

  return {...config, collections: checkOrTransformKanbanCollectionsConfig(config.collections, collections)};
}

function checkOrTransformKanbanCollectionsConfig(
  collectionsConfig: Record<string, KanbanCollectionConfig>,
  collections: Collection[]
): Record<string, KanbanCollectionConfig> {
  if (!collectionsConfig) {
    return collectionsConfig;
  }

  return Object.keys(collectionsConfig).reduce((map, key) => {
    const collectionConfig = collectionsConfig[key];
    if (collectionConfig && collectionConfig.attribute) {
      const collection = (collections || []).find(coll => coll.id === collectionConfig.attribute.collectionId);
      const attribute = findAttribute(collection && collection.attributes, collectionConfig.attribute.attributeId);
      if (attribute) {
        map[key] = collectionConfig;
      }
    }

    return map;
  }, {});
}

function createDefaultConfig(): KanbanConfig {
  return {columns: [], collections: {}};
}

export function kanbanConfigIsEmpty(config: KanbanConfig): boolean {
  return config && Object.values(config.collections || {}).filter(value => !!value).length === 0;
}
