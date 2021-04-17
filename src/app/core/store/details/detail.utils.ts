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

import {DetailConfig, DetailStemConfig} from './detail';
import {arrayContainsSameItems} from '@lumeer/lumeer-gantt/dist/utils/common.utils';
import {viewAttributeSettingsChanged} from '../../../shared/settings/settings.util';
import {Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {Query, QueryStem} from '../navigation/query/query';
import {
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  getBaseCollectionIdsFromQuery,
  queryIsEmpty,
  queryStemWithoutFilters,
} from '../navigation/query/query.util';

export function modifyDetailPerspectiveQuery(query: Query, collections: Collection[]): Query {
  if (queryIsEmpty(query)) {
    const stems: QueryStem[] = (collections || []).map(collection => ({collectionId: collection.id}));
    return {stems};
  }
  const collectionIdsInQuery = getBaseCollectionIdsFromQuery(query);
  const stems: QueryStem[] = (collections || [])
    .filter(collection => collectionIdsInQuery.includes(collection.id))
    .map(collection => ({collectionId: collection.id}));
  return {stems};
}

export function isDetailConfigChanged(
  viewConfig: DetailConfig,
  previousConfig: DetailConfig,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (!arrayContainsSameItems(viewConfig?.collapsedLinkTypes, previousConfig?.collapsedLinkTypes)) {
    return true;
  }

  const viewConfigStems = viewConfig?.stemsConfigs || [];
  const previousConfigStems = previousConfig?.stemsConfigs || [];

  if (viewConfigStems.length !== previousConfigStems.length) {
    return true;
  }

  return viewConfigStems.some((stemConfig, index) =>
    isDetailStemConfigChanged(stemConfig, previousConfigStems[index], collectionsMap, linkTypesMap)
  );
}

export function isDetailStemConfigChanged(
  s1: DetailStemConfig,
  s2: DetailStemConfig,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return viewAttributeSettingsChanged(s1.attributesSettings, s2.attributesSettings, collectionsMap, linkTypesMap);
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
  return (query?.stems || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1)[0];
    return {...stemConfig, stem: queryStemWithoutFilters(stem)};
  });
}

function detailDefaultConfig(query: Query): DetailConfig {
  const stemsConfigs: DetailStemConfig[] = (query?.stems || []).map(stem => ({stem}));
  return {collapsedLinkTypes: [], stemsConfigs};
}
