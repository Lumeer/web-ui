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
import {Query} from '../../dto';
import {AttributeFilterModel, QueryModel, QueryStemModel} from './query.model';
import {AttributeFilter, QueryStem} from '../../dto/query';

export class QueryConverter {
  public static fromDto(dto: Query): QueryModel {
    return {
      stems: dto.stems && dto.stems.map(stem => this.fromStemDto(stem)),
      fulltexts: dto.fulltexts,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  public static toDto(model: QueryModel): Query {
    return {
      stems: model.stems && model.stems.map(stem => this.toStemDto(stem)),
      fulltexts: model.fulltexts,
      page: model.page,
      pageSize: model.pageSize,
    };
  }

  public static fromStemDto(dto: QueryStem): QueryStemModel {
    return {
      collectionId: dto.collectionId,
      documentIds: dto.documentIds,
      linkTypeIds: dto.linkTypeIds,
      filters: dto.filters && dto.filters.map(filter => this.fromAttributeFilterDto(filter)),
    };
  }

  public static toStemDto(model: QueryStemModel): QueryStem {
    return {
      collectionId: model.collectionId,
      documentIds: model.documentIds,
      linkTypeIds: model.linkTypeIds,
      filters: model.filters && model.filters.map(filter => this.toAttributeFilterDto(filter)),
    };
  }

  public static fromAttributeFilterDto(dto: AttributeFilter): AttributeFilterModel {
    return {
      collectionId: dto.collectionId,
      attributeId: dto.attributeId,
      condition: dto.operator,
      value: dto.value,
    };
  }

  public static toAttributeFilterDto(model: AttributeFilterModel): AttributeFilter {
    return {
      collectionId: model.collectionId,
      attributeId: model.attributeId,
      operator: model.condition,
      value: model.value,
    };
  }

  public static toString(query: QueryModel): string {
    return JSON.stringify(query ? query : {}, (key, value) => {
      if (!value || (value instanceof Array && value.length === 0)) {
        return undefined;
      }
      return value;
    });
  }

  public static fromString(stringQuery: string): QueryModel {
    const parsedQuery = stringQuery ? this.parseStringQuery(stringQuery) : {};
    const query: QueryModel = parsedQuery ? parsedQuery : {};

    query.stems = query.stems || [];
    query.fulltexts = query.fulltexts || [];
    query.pageSize = isNullOrUndefined(query.pageSize) ? null : query.pageSize;
    query.page = isNullOrUndefined(query.page) ? null : query.page;

    return query;
  }

  private static parseStringQuery(stringQuery: string) {
    try {
      return JSON.parse(stringQuery);
    } catch (e) {
      return null;
    }
  }
}
