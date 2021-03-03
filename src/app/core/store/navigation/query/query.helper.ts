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
  containsSameElements,
  deepArrayEquals,
  getArrayDifference,
  isArraySubset,
} from '../../../../shared/utils/array.utils';
import {convertQueryModelToString, normalizeQueryModel, normalizeQueryStem} from './query.converter';
import {Query, QueryStem} from './query';
import {getBaseCollectionIdsFromQuery, queryWithoutFilters} from './query.util';
import {DataQuery} from '../../../model/data-query';

export function addDataQueryUnique(queries: DataQuery[], newQuery: DataQuery): DataQuery[] {
  if (!newQuery || queries.some(query => areDataQueriesEqual(query, newQuery))) {
    return queries;
  }
  return [...queries, newQuery];
}

export function removeDataQuery(queries: DataQuery[], queryToRemove: DataQuery): DataQuery[] {
  if (!queryToRemove) {
    return queries;
  }
  return queries.filter(query => !areDataQueriesEqual(query, queryToRemove));
}

export function areDataQueriesEqual(first: DataQuery, second: DataQuery): boolean {
  return !!first?.includeSubItems === !!second?.includeSubItems && areQueriesEqual(first, second);
}

export function areQueriesEqual(first: Query, second: Query): boolean {
  const firstNormalized = normalizeQueryModel(first);
  const secondNormalized = normalizeQueryModel(second);

  return (
    firstNormalized.page === secondNormalized.page &&
    firstNormalized.pageSize === secondNormalized.pageSize &&
    containsSameElements(firstNormalized.fulltexts, secondNormalized.fulltexts) &&
    firstNormalized.stems.length === secondNormalized.stems.length &&
    firstNormalized.stems.every(stem => secondNormalized.stems.some(otherStem => areQueryStemsEqual(stem, otherStem)))
  );
}

export function areQueryStemsEqual(first: QueryStem, second: QueryStem): boolean {
  const firstNormalized = normalizeQueryStem(first);
  const secondNormalized = normalizeQueryStem(second);

  return (
    firstNormalized.collectionId === secondNormalized.collectionId &&
    containsSameElements(firstNormalized.filters, secondNormalized.filters) &&
    containsSameElements(firstNormalized.linkFilters, secondNormalized.linkFilters) &&
    containsSameElements(firstNormalized.documentIds, secondNormalized.documentIds) &&
    containsSameElements(firstNormalized.linkTypeIds, secondNormalized.linkTypeIds)
  );
}

export function areQueriesEqualExceptFiltersAndPagination(first: Query, second: Query): boolean {
  const firstWithoutPagination = queryWithoutFilters({...first, page: null, pageSize: null});
  const secondWithoutPagination = queryWithoutFilters({...second, page: null, pageSize: null});
  return convertQueryModelToString(firstWithoutPagination) === convertQueryModelToString(secondWithoutPagination);
}

export function hasQueryNewLink(oldQuery: Query, newQuery: Query) {
  if (
    (oldQuery?.stems || []).length !== (newQuery?.stems || []).length ||
    !deepArrayEquals(getBaseCollectionIdsFromQuery(oldQuery), getBaseCollectionIdsFromQuery(newQuery))
  ) {
    return false;
  }

  const newQueryLinkTypeIds = newQuery?.stems?.[0].linkTypeIds || [];
  const oldQueryLinkTypeIds = oldQuery?.stems?.[0].linkTypeIds || [];

  if (newQueryLinkTypeIds.length === 1 && oldQueryLinkTypeIds.length === 0) {
    return true;
  }

  return (
    newQueryLinkTypeIds.length > oldQueryLinkTypeIds.length && isArraySubset(newQueryLinkTypeIds, oldQueryLinkTypeIds)
  );
}

export function getNewLinkTypeIdFromQuery(oldQuery: Query, newQuery: Query): string {
  const newQueryLinkTypeIds = (newQuery.stems[0] && newQuery.stems[0].linkTypeIds) || [];
  const oldQueryLinkTypeIds = (oldQuery.stems[0] && oldQuery.stems[0].linkTypeIds) || [];

  const linkTypeIds = getArrayDifference(newQueryLinkTypeIds, oldQueryLinkTypeIds);
  if (linkTypeIds.length !== 1) {
    throw Error('No new link type IDs');
  }
  return linkTypeIds[0];
}
