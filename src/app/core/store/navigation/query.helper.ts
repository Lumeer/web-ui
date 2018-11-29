/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {deepArrayEquals, getArrayDifference, isArraySubset} from '../../../shared/utils/array.utils';
import {QueryConverter} from './query.converter';
import {QueryModel} from './query.model';
import {getBaseCollectionIdsFromQuery} from './query.util';

export function areQueriesEqual(first: QueryModel, second: QueryModel): boolean {
  return QueryConverter.toString(first) === QueryConverter.toString(second);
}

export function areQueriesEqualExceptPagination(first: QueryModel, second: QueryModel): boolean {
  const firstWithoutPagination = {...first, page: null, pageSize: null};
  const secondWithoutPagination = {...second, page: null, pageSize: null};
  return QueryConverter.toString(firstWithoutPagination) === QueryConverter.toString(secondWithoutPagination);
}

export function hasQueryNewLink(oldQuery: QueryModel, newQuery: QueryModel) {
  if (
    oldQuery.stems.length !== newQuery.stems.length ||
    !deepArrayEquals(getBaseCollectionIdsFromQuery(oldQuery), getBaseCollectionIdsFromQuery(newQuery))
  ) {
    return false;
  }

  const newQueryLinkTypeIds = (newQuery.stems[0] && newQuery.stems[0].linkTypeIds) || [];
  const oldQueryLinkTypeIds = (oldQuery.stems[0] && oldQuery.stems[0].linkTypeIds) || [];

  return (
    newQueryLinkTypeIds.length > oldQueryLinkTypeIds.length && isArraySubset(newQueryLinkTypeIds, oldQueryLinkTypeIds)
  );
}

export function getNewLinkTypeIdFromQuery(oldQuery: QueryModel, newQuery: QueryModel): string {
  const newQueryLinkTypeIds = (newQuery.stems[0] && newQuery.stems[0].linkTypeIds) || [];
  const oldQueryLinkTypeIds = (oldQuery.stems[0] && oldQuery.stems[0].linkTypeIds) || [];

  const linkTypeIds = getArrayDifference(newQueryLinkTypeIds, oldQueryLinkTypeIds);
  if (linkTypeIds.length !== 1) {
    throw Error('No new link type IDs');
  }
  return linkTypeIds[0];
}
