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
  KanbanAttribute,
  KanbanColumn,
  KanbanConfig,
  KanbanConfigVersion,
  KanbanStemConfig,
} from '../../../../core/store/kanbans/kanban';
import {areArraysSame} from '../../../../shared/utils/array.utils';
import {Collection} from '../../../../core/store/collections/collection';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  checkOrTransformQueryResource,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {normalizeQueryStem} from '../../../../core/store/navigation/query/query.converter';
import {SizeType} from '../../../../shared/slider/size/size-type';
import {PostItLayoutType} from '../../../../shared/post-it/post-it-layout-type';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {createDefaultTaskPurposeConfig} from '../../common/perspective-util';

export function isKanbanConfigChanged(viewConfig: KanbanConfig, currentConfig: KanbanConfig): boolean {
  if (stemConfigsChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || [])) {
    return true;
  }

  const currentColumns = currentConfig.columns || [];
  return (
    (viewConfig.columns || []).some((column, index) => {
      if (index > currentColumns.length - 1) {
        return true;
      }

      const currentColumn = (currentConfig.columns || [])[index];
      return kanbanColumnsChanged(column, currentColumn);
    }) || kanbanColumnsChanged(viewConfig.otherColumn, currentConfig.otherColumn)
  );
}

function stemConfigsChanged(viewStemsConfigs: KanbanStemConfig[], currentStemsConfigs: KanbanStemConfig[]): boolean {
  const normalizedViewStemsConfigs = viewStemsConfigs.map(config => ({
    ...config,
    stem: config.stem && normalizeQueryStem(config.stem),
  }));
  const normalizedCurrentStemsConfigs = currentStemsConfigs.map(config => ({
    ...config,
    stem: config.stem && normalizeQueryStem(config.stem),
  }));

  return !areArraysSame(normalizedViewStemsConfigs, normalizedCurrentStemsConfigs);
}

function kanbanColumnsChanged(column1: KanbanColumn, column2: KanbanColumn): boolean {
  return column1?.title !== column2?.title || column1?.width !== column2?.width;
}

export function checkOrTransformKanbanConfig(
  config: KanbanConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): KanbanConfig {
  if (!config) {
    return createDefaultConfig(query, collections, linkTypes);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformKanbanStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

function checkOrTransformKanbanStemsConfig(
  stemsConfigs: KanbanStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): KanbanStemConfig[] {
  if (!stemsConfigs) {
    return stemsConfigs;
  }

  const stemsConfigsCopy = [...stemsConfigs];
  return ((query && query.stems) || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformKanbanStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
}

function checkOrTransformKanbanStemConfig(
  stemConfig: KanbanStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): KanbanStemConfig {
  if (!stemConfig) {
    return createDefaultKanbanStemConfig(stem, collections, linkTypes);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    attribute: checkOrTransformQueryAttribute(stemConfig.attribute, attributesResourcesOrder),
    stem,
    dueDate: checkOrTransformQueryAttribute(stemConfig.dueDate, attributesResourcesOrder),
    doneColumnTitles: stemConfig.doneColumnTitles,
    aggregation: checkOrTransformQueryAttribute(stemConfig.aggregation, attributesResourcesOrder),
    resource: checkOrTransformQueryResource(stemConfig.resource, attributesResourcesOrder),
  };
}

function createDefaultConfig(query: Query, collections: Collection[], linkTypes: LinkType[]): KanbanConfig {
  const stems = query?.stems || [];
  const stemsConfigs = stems.map(stem => createDefaultKanbanStemConfig(stem, collections, linkTypes));
  return {
    columns: [],
    stemsConfigs,
    version: KanbanConfigVersion.V2,
    cardLayout: PostItLayoutType.Half,
    columnSize: SizeType.M,
  };
}

export function createDefaultKanbanStemConfig(
  stem?: QueryStem,
  collections?: Collection[],
  linkTypes?: LinkType[]
): KanbanStemConfig {
  if (stem && collections && linkTypes) {
    const {state: attribute, dueDate, stateList: doneColumnTitles} = createDefaultTaskPurposeConfig(
      stem,
      collections,
      linkTypes
    );
    if (attribute) {
      return {attribute, stem, dueDate, doneColumnTitles};
    }
  }
  return {attribute: null, stem, dueDate: null, doneColumnTitles: []};
}

export function kanbanConfigIsEmpty(kanbanConfig: KanbanConfig): boolean {
  return kanbanConfig && kanbanConfig.stemsConfigs.filter(config => !!config.attribute).length === 0;
}

export function cleanKanbanAttribute(attribute: KanbanAttribute): KanbanAttribute {
  return (
    attribute && {
      resourceIndex: attribute.resourceIndex,
      attributeId: attribute.attributeId,
      resourceId: attribute.resourceId,
      resourceType: attribute.resourceType,
    }
  );
}

export function isKanbanAggregationDefined(config: KanbanConfig): boolean {
  return (config?.stemsConfigs || []).some(stemConfig => isNotNullOrUndefined(stemConfig.aggregation));
}
