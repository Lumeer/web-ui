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
import {arrayContainsSameItems} from '@lumeer/lumeer-gantt/dist/utils/common.utils';

import {viewAttributeSettingsChanged, viewAttributesSettingsIsEmpty} from '../../../shared/settings/settings.util';
import {Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {Query, QueryStem} from '../navigation/query/query';
import {
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryContainsOnlyFulltexts,
  queryIsEmpty,
  queryStemWithoutFilters,
  queryStemsAreSame,
} from '../navigation/query/query.util';
import {DetailConfig, DetailStemConfig} from './detail';

export function modifyDetailPerspectiveQuery(query: Query, collections: Collection[]): Query {
  if (queryIsEmpty(query) || queryContainsOnlyFulltexts(query)) {
    const stems: QueryStem[] = (collections || []).map(collection => ({collectionId: collection.id}));
    return {stems, fulltexts: query?.fulltexts};
  }
  return query;
}

export function createFlatResourcesSettingsQuery(collections: Collection[], linkTypes: LinkType[] = []): Query {
  const stems: QueryStem[] = (collections || []).map(collection => createFlatCollectionSettingsQueryStem(collection));
  const linkStems = (linkTypes || []).map(linkType => createFlatLinkTypeSettingsQueryStem(linkType));

  return {stems: [...stems, ...linkStems]};
}

export function createFlatCollectionSettingsQueryStem(collection: Collection): QueryStem {
  return {collectionId: collection.id};
}

export function createFlatLinkTypeSettingsQueryStem(linkType: LinkType): QueryStem {
  return {collectionId: '', linkTypeIds: [linkType.id]};
}

export function isDetailConfigChanged(
  viewConfig: DetailConfig,
  previousConfig: DetailConfig,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (
    !arrayContainsSameItems(viewConfig?.collapsedLinkTypes, previousConfig?.collapsedLinkTypes) ||
    !arrayContainsSameItems(viewConfig?.collapsedCollections, previousConfig?.collapsedCollections)
  ) {
    return true;
  }

  let viewConfigStems = (viewConfig?.stemsConfigs || []).filter(stemConfig => !detailStemConfigIsEmpty(stemConfig));
  let previousConfigStems = (previousConfig?.stemsConfigs || []).filter(
    stemConfig => !detailStemConfigIsEmpty(stemConfig)
  );

  if (viewConfigStems.length !== previousConfigStems.length) {
    viewConfigStems = cleanEmptyStemConfigs(viewConfigStems, collectionsMap, linkTypesMap);
    previousConfigStems = cleanEmptyStemConfigs(previousConfigStems, collectionsMap, linkTypesMap);
    if (viewConfigStems.length !== previousConfigStems.length) {
      return true;
    }
  }

  const viewConfigStemsCopy = [...viewConfigStems];

  for (let i = viewConfigStemsCopy.length - 1; i >= 0; i--) {
    const stemConfig = viewConfigStemsCopy[i];
    const indexInPrevious = previousConfigStems.findIndex(previousStemConfig =>
      queryStemsAreSame(previousStemConfig.stem, stemConfig.stem)
    );
    if (indexInPrevious >= 0) {
      if (isDetailStemConfigChanged(stemConfig, previousConfigStems[indexInPrevious], collectionsMap, linkTypesMap)) {
        return true;
      }
      viewConfigStems.splice(i, 1);
      previousConfigStems.splice(indexInPrevious, 1);
    }
  }

  return viewConfigStems.some((stemConfig, index) =>
    isDetailStemConfigChanged(stemConfig, previousConfigStems[index], collectionsMap, linkTypesMap)
  );
}

function cleanEmptyStemConfigs(
  stemConfigs: DetailStemConfig[],
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): DetailStemConfig[] {
  return stemConfigs.filter(stemConfig => isDetailStemConfigChanged(stemConfig, null, collectionsMap, linkTypesMap));
}

export function createDetailSaveConfig(config: DetailConfig): DetailConfig {
  const stemsConfigs = (config?.stemsConfigs || []).filter(config => !detailStemConfigIsEmpty(config));
  return {
    ...config,
    stemsConfigs,
  };
}

function detailStemConfigIsEmpty(stemConfig: DetailStemConfig): boolean {
  return viewAttributesSettingsIsEmpty(stemConfig.attributesSettings);
}

export function isDetailStemConfigChanged(
  s1: DetailStemConfig,
  s2: DetailStemConfig,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return viewAttributeSettingsChanged(s1?.attributesSettings, s2?.attributesSettings, collectionsMap, linkTypesMap);
}

export function checkOrTransformDetailConfig(
  config: DetailConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): DetailConfig {
  if (!config) {
    return detailDefaultConfig(query);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformDetailStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

function checkOrTransformDetailStemsConfig(
  stemsConfigs: DetailStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): DetailStemConfig[] {
  const stemsConfigsCopy = [...(stemsConfigs || [])];
  const unpairedStems = [];
  const resultStemsConfigs = [];

  // first we find all stems that are same
  for (const stem of query?.stems || []) {
    const stemConfigIndex = stemsConfigsCopy.findIndex(stemConfig => queryStemsAreSame(stemConfig.stem, stem));
    if (stemConfigIndex >= 0) {
      const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1)[0];
      resultStemsConfigs.push({...stemConfig, stem: queryStemWithoutFilters(stem)});
    } else {
      unpairedStems.push(stem);
    }
  }

  // then we try to find stems by matching collection ids in query
  for (const stem of unpairedStems) {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1)[0];
    resultStemsConfigs.push({...stemConfig, stem: queryStemWithoutFilters(stem)});
  }

  return resultStemsConfigs;
}

function detailDefaultConfig(query: Query): DetailConfig {
  const stemsConfigs: DetailStemConfig[] = (query?.stems || []).map(stem => ({stem}));
  return {collapsedLinkTypes: [], stemsConfigs};
}
