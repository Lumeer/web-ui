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

export function areQueriesEqual(first: QueryModel, second: QueryModel): boolean {
  return QueryConverter.toString(first) === QueryConverter.toString(second);
}

export function areQueriesEqualExceptPagination(first: QueryModel, second: QueryModel): boolean {
  const firstWithoutPagination = {...first, page: null, pageSize: null};
  const secondWithoutPagination = {...second, page: null, pageSize: null};
  return QueryConverter.toString(firstWithoutPagination) === QueryConverter.toString(secondWithoutPagination);
}

export function hasQueryNewLink(oldQuery: QueryModel, newQuery: QueryModel) {
  if (!deepArrayEquals(oldQuery.collectionIds, newQuery.collectionIds)) {
    return false;
  }

  return (
    newQuery.linkTypeIds.length > oldQuery.linkTypeIds.length &&
    isArraySubset(newQuery.linkTypeIds, oldQuery.linkTypeIds)
  );
}

export function getNewLinkTypeIdFromQuery(oldQuery: QueryModel, newQuery: QueryModel): string {
  const linkTypeIds = getArrayDifference(newQuery.linkTypeIds, oldQuery.linkTypeIds);
  if (linkTypeIds.length !== 1) {
    throw Error('No new link type IDs');
  }
  return linkTypeIds[0];
}
