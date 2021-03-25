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

import {DataQuery} from '../../model/data-query';
import {Workspace} from '../navigation/workspace';
import {areDataQueriesEqual} from '../navigation/query/query.helper';
import {Query, QueryStem} from '../navigation/query/query';
import {isQuerySubset} from '../navigation/query/query.util';
import {AllowedPermissions} from '../../model/allowed-permissions';

export interface DataQueryPayload {
  query: DataQuery;
  workspace?: Workspace;
  force?: boolean;
  silent?: boolean;
}

export function shouldLoadByDataQuery(
  payload: DataQueryPayload,
  queries: DataQuery[],
  loadingQueries: DataQuery[],
  publicView: boolean
): boolean {
  if (payload.force) {
    return true;
  }

  // is already loaded
  if (isDataQueryLoaded(payload.query, queries, publicView)) {
    return false;
  }

  // is currently loading
  return !loadingQueries.some(query => areDataQueriesEqual(query, payload.query));
}

export function checkLoadedDataQueryPayload(
  payload: DataQueryPayload,
  publicView: boolean,
  collectionsPermissions?: Record<string, AllowedPermissions>,
  linkTypePermissions?: Record<string, AllowedPermissions>
): DataQueryPayload {
  return {
    ...payload,
    query: checkLoadedDataQuery(payload.query, collectionsPermissions, linkTypePermissions, publicView, payload.silent),
  };
}

function checkLoadedDataQuery(
  query: DataQuery,
  collectionsPermissions?: Record<string, AllowedPermissions>,
  linkTypePermissions?: Record<string, AllowedPermissions>,
  publicView?: boolean,
  silent?: boolean
): Query {
  if (publicView) {
    return {};
  }
  return silent ? undefined : removeUnneededFilters(query, collectionsPermissions, linkTypePermissions);
}

function removeUnneededFilters(
  query: Query,
  collectionsPermissions?: Record<string, AllowedPermissions>,
  linkTypePermissions?: Record<string, AllowedPermissions>
): Query {
  const shouldSkipFulltexts =
    query?.stems?.length > 0 &&
    query?.stems.some(
      stem =>
        !collectionsPermissions?.[stem.collectionId]?.read ||
        (stem.linkTypeIds || []).some(linkTypeId => !linkTypePermissions?.[linkTypeId]?.read)
    );

  return {
    ...query,
    stems: query?.stems?.map(stem => removeUnneededFiltersFromStem(stem, collectionsPermissions, linkTypePermissions)),
    fulltexts: shouldSkipFulltexts ? [] : query?.fulltexts,
  };
}

function removeUnneededFiltersFromStem(
  stem: QueryStem,
  collectionsPermissions?: Record<string, AllowedPermissions>,
  linkTypePermissions?: Record<string, AllowedPermissions>
): QueryStem {
  return {
    ...stem,
    filters: stem.filters?.filter(filter => !collectionsPermissions?.[filter.collectionId]?.read),
    linkFilters: stem.linkFilters?.filter(filter => !linkTypePermissions?.[filter.linkTypeId]?.read),
  };
}

export function isDataQueryLoaded(query: DataQuery, loadedQueries: DataQuery[], publicView: boolean): boolean {
  const savedQuery = checkLoadedDataQuery(query, {}, {}, publicView);
  return loadedQueries.some(
    loadedQuery => !!query?.includeSubItems === !!loadedQuery?.includeSubItems && isQuerySubset(savedQuery, loadedQuery)
  );
}
