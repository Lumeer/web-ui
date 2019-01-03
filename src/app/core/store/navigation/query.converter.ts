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

import {isNullOrUndefined} from 'util';
import {QueryDto} from '../../dto';
import {AttributeFilter, Query, QueryStem} from './query';
import {AttributeFilterDto, QueryStemDto} from '../../dto/query.dto';

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
  };
}

function convertQueryStemModelToDto(model: QueryStem): QueryStemDto {
  return {
    collectionId: model.collectionId,
    documentIds: model.documentIds,
    linkTypeIds: model.linkTypeIds,
    filters: model.filters && model.filters.map(filter => convertAttributeFilterModelToDto(filter)),
  };
}

function convertAttributeFilterDtoToModel(dto: AttributeFilterDto): AttributeFilter {
  return {
    collectionId: dto.collectionId,
    attributeId: dto.attributeId,
    condition: dto.operator,
    value: dto.value,
  };
}

function convertAttributeFilterModelToDto(model: AttributeFilter): AttributeFilterDto {
  return {
    collectionId: model.collectionId,
    attributeId: model.attributeId,
    operator: model.condition,
    value: model.value,
  };
}

export function convertQueryModelToString(query: Query): string {
  return JSON.stringify(query ? query : {}, (key, value) => {
    if (!value || (value instanceof Array && value.length === 0)) {
      return undefined;
    }
    return value;
  });
}

export function convertStringToQueryModel(stringQuery: string): Query {
  const parsedQuery = stringQuery ? parseStringQuery(stringQuery) : {};
  const query: Query = parsedQuery ? parsedQuery : {};

  query.stems = query.stems || [];
  query.fulltexts = query.fulltexts || [];
  query.pageSize = isNullOrUndefined(query.pageSize) ? null : query.pageSize;
  query.page = isNullOrUndefined(query.page) ? null : query.page;

  return query;
}

function parseStringQuery(stringQuery: string) {
  try {
    return JSON.parse(stringQuery);
  } catch (e) {
    return null;
  }
}
