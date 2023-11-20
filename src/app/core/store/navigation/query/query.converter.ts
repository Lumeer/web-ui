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
import {AttributeFilter, ConditionType} from '@lumeer/data-filters';
import {isNullOrUndefined} from '@lumeer/utils';

import {findAttributeByName} from '../../../../shared/utils/attribute.utils';
import {QueryDto} from '../../../dto';
import {
  convertCollectionAttributeFilterDtoToModel,
  convertCollectionAttributeFilterModelToDto,
  convertLinkAttributeFilterDtoToModel,
  convertLinkAttributeFilterModelToDto,
} from '../../../dto/attribute-filter.dto';
import {QueryStemDto} from '../../../dto/query.dto';
import {Collection} from '../../collections/collection';
import {decodeQueryParam, encodeQueryParam} from '../query-param-encoding';
import {CollectionAttributeFilter, Query, QueryStem} from './query';
import {ShortenedQuery, prolongQuery, shortenQuery} from './shortened-query';

export function convertQueryDtoToModel(dto: QueryDto): Query {
  return (
    dto && {
      stems: dto.stems?.map(stem => convertQueryStemDtoToModel(stem)),
      fulltexts: dto.fulltexts,
      page: dto.page,
      pageSize: dto.pageSize,
    }
  );
}

export function convertQueryModelToDto(model: Query): QueryDto {
  return (
    model && {
      stems: model.stems?.map(stem => convertQueryStemModelToDto(stem)),
      fulltexts: model.fulltexts,
      page: model.page,
      pageSize: model.pageSize,
    }
  );
}

function convertQueryStemDtoToModel(dto: QueryStemDto): QueryStem {
  return {
    id: dto.id,
    collectionId: dto.collectionId,
    documentIds: dto.documentIds,
    linkTypeIds: dto.linkTypeIds,
    filters: dto.filters?.map(filter => convertCollectionAttributeFilterDtoToModel(filter)),
    linkFilters: dto.linkFilters?.map(filter => convertLinkAttributeFilterDtoToModel(filter)),
  };
}

function convertQueryStemModelToDto(model: QueryStem): QueryStemDto {
  return {
    id: model.id,
    collectionId: model.collectionId,
    documentIds: model.documentIds,
    linkTypeIds: model.linkTypeIds,
    filters: model.filters?.map(filter => convertCollectionAttributeFilterModelToDto(filter)),
    linkFilters: model.linkFilters?.map(filter => convertLinkAttributeFilterModelToDto(filter)),
  };
}

export function convertQueryModelToString(query: Query): string {
  return encodeQueryParam(stringifyQuery(shortenQuery(query)));
}

export function addFiltersToQuery(query: Query, filters: string, collection: Collection): Query {
  if (!!query.stems && query.stems.length > 0) {
    // copy the parts that are going to be updated
    const res = {...query};
    res.stems = [...res.stems];
    res.stems[0] = {...res.stems[0]};

    const additionalFilters = parseStringFilters(filters, collection);
    res.stems[0].filters = !!res.stems[0].filters ? [...res.stems[0].filters, ...additionalFilters] : additionalFilters;

    return res;
  }

  return query;
}

function parseStringFilters(filtersStr: string, collection: Collection): CollectionAttributeFilter[] {
  const filters: CollectionAttributeFilter[] = [];

  const re = /[^\\];/g;
  let m;
  const indexes = [];
  while ((m = re.exec(filtersStr)) != null) {
    indexes.push(m.index + 1);
  }
  indexes.push(filtersStr.length);

  let prevIndex = 0;
  for (let i = 0; i < indexes.length; i++) {
    const f = filtersStr.substring(prevIndex, indexes[i]);
    prevIndex = indexes[i] + 1;

    const opMatch = /[^\\][=<>!\?]+([^=<>!\?]|$)/.exec(f);
    const hasValue = opMatch[0].search(/[=<>!\?]$/) < 0;
    const opIndex = opMatch.index + 1;
    const opLength = opMatch[0].length - (hasValue ? 2 : 1);
    const attrName = f.substring(0, opIndex)?.trim().replace(/\\/g, '');
    const opStr = f.substring(opIndex, opIndex + opLength) || '';
    const value = f.substring(opIndex + opLength)?.replace(/\\/g, '');

    if (!!attrName) {
      const op = stringOperatorToEnum(opStr);
      const attr = findAttributeByName(collection.attributes, attrName);

      if (!!attr && !!op) {
        filters.push({collectionId: collection.id, attributeId: attr.id, conditionValues: [{value}], condition: op});
      }
    }
  }

  return filters;
}

function stringOperatorToEnum(op: string) {
  switch (op) {
    case '=':
      return ConditionType.Equals;
    case '<':
      return ConditionType.LowerThan;
    case '<=':
      return ConditionType.LowerThanEquals;
    case '>':
      return ConditionType.GreaterThan;
    case '>=':
      return ConditionType.GreaterThanEquals;
    case '!=':
      return ConditionType.NotEquals;
    case '!':
      return ConditionType.NotEmpty;
    case '?':
      return ConditionType.IsEmpty;
    default:
      return '';
  }
}

function stringifyQuery(query: ShortenedQuery): string {
  if (!query) {
    return '';
  }

  return JSON.stringify(query, (key, value) => {
    if (isNullOrUndefined(value) || (value instanceof Array && value.length === 0)) {
      return undefined;
    }
    return value;
  });
}

export function convertQueryStringToModel(stringQuery: string): Query {
  return normalizeQueryModel(prolongQuery(parseStringQuery(decodeQueryParam(stringQuery))));
}

function parseStringQuery(stringQuery: string): ShortenedQuery {
  try {
    return JSON.parse(stringQuery);
  } catch (e) {
    return null;
  }
}

export function normalizeQueryModel(query: Query): Query {
  return {
    stems: (query?.stems || []).map(stem => normalizeQueryStem(stem)),
    fulltexts: query?.fulltexts || [],
    page: isNullOrUndefined(query?.page) ? null : query.page,
    pageSize: isNullOrUndefined(query?.pageSize) ? null : query.pageSize,
  };
}

export function normalizeQueryStem(stem: QueryStem): QueryStem {
  return {
    id: stem.id,
    collectionId: stem.collectionId,
    documentIds: stem.documentIds || [],
    filters: (stem.filters || []).map(filter => normalizeFilter(filter)),
    linkFilters: (stem.linkFilters || []).map(filter => normalizeFilter(filter)),
    linkTypeIds: stem.linkTypeIds || [],
  };
}

function normalizeFilter<T extends AttributeFilter>(filter: T): T {
  return {
    ...filter,
    condition: filter.condition || null,
    conditionValues: (filter.conditionValues || []).map(v => ({value: v.value || null, type: v.type || null})),
  };
}
