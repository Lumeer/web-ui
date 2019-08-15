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

import {isNullOrUndefined} from '../../../shared/utils/common.utils';
import {QueryDto} from '../../dto';
import {AttributeFilterDto, LinkAttributeFilterDto, QueryStemDto} from '../../dto/query.dto';
import {CollectionAttributeFilter, LinkAttributeFilter, Query, QueryStem} from './query';
import {decodeQuery, encodeQuery} from './query/query-encoding';
import {prolongQuery, ShortenedQuery, shortenQuery} from './query/shortened-query';

export function convertQueryDtoToModel(dto: QueryDto): Query {
  return {
    stems: dto.stems && dto.stems.map(stem => convertQueryStemDtoToModel(stem)),
    fulltexts: dto.fulltexts,
    page: dto.page,
    pageSize: dto.pageSize,
  };
}

export function convertQueryModelToDto(model: Query): QueryDto {
  return {
    stems: model.stems && model.stems.map(stem => convertQueryStemModelToDto(stem)),
    fulltexts: model.fulltexts,
    page: model.page,
    pageSize: model.pageSize,
  };
}

function convertQueryStemDtoToModel(dto: QueryStemDto): QueryStem {
  return {
    collectionId: dto.collectionId,
    documentIds: dto.documentIds,
    linkTypeIds: dto.linkTypeIds,
    filters: dto.filters && dto.filters.map(filter => convertAttributeFilterDtoToModel(filter)),
    linkFilters: dto.linkFilters && dto.linkFilters.map(filter => convertLinkAttributeFilterDtoToModel(filter)),
  };
}

function convertQueryStemModelToDto(model: QueryStem): QueryStemDto {
  return {
    collectionId: model.collectionId,
    documentIds: model.documentIds,
    linkTypeIds: model.linkTypeIds,
    filters: model.filters && model.filters.map(filter => convertAttributeFilterModelToDto(filter)),
    linkFilters: model.linkFilters && model.linkFilters.map(filter => convertLinkAttributeFilterModelToDto(filter)),
  };
}

function convertAttributeFilterDtoToModel(dto: AttributeFilterDto): CollectionAttributeFilter {
  return {
    collectionId: dto.collectionId,
    attributeId: dto.attributeId,
    condition: dto.operator,
    value: dto.value,
  };
}

function convertLinkAttributeFilterDtoToModel(dto: LinkAttributeFilterDto): LinkAttributeFilter {
  return {
    linkTypeId: dto.linkTypeId,
    attributeId: dto.attributeId,
    condition: dto.operator,
    value: dto.value,
  };
}

function convertAttributeFilterModelToDto(model: CollectionAttributeFilter): AttributeFilterDto {
  return {
    collectionId: model.collectionId,
    attributeId: model.attributeId,
    operator: model.condition,
    value: model.value,
  };
}

function convertLinkAttributeFilterModelToDto(model: LinkAttributeFilter): LinkAttributeFilterDto {
  return {
    linkTypeId: model.linkTypeId,
    attributeId: model.attributeId,
    operator: model.condition,
    value: model.value,
  };
}

export function convertQueryModelToString(query: Query): string {
  return encodeQuery(stringifyQuery(shortenQuery(query)));
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
  return normalizeQueryModel(prolongQuery(parseStringQuery(decodeQuery(stringQuery))));
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
    stems: ((query && query.stems) || []).map(stem => normalizeQueryStem(stem)),
    fulltexts: (query && query.fulltexts) || [],
    page: isNullOrUndefined(query && query.page) ? null : query.page,
    pageSize: isNullOrUndefined(query && query.pageSize) ? null : query.pageSize,
  };
}

export function normalizeQueryStem(stem: QueryStem): QueryStem {
  return {
    collectionId: stem.collectionId,
    documentIds: stem.documentIds || [],
    filters: stem.filters || [],
    linkFilters: stem.linkFilters || [],
    linkTypeIds: stem.linkTypeIds || [],
  };
}
