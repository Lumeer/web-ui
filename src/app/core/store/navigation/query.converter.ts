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
import {AttributeFilter, QueryModel} from './query.model';
import {conditionFromString} from './query.util';

export class QueryConverter {
  public static fromDto(dto: Query): QueryModel {
    return {
      collectionIds: dto.collectionIds,
      documentIds: dto.documentIds,
      filters: dto.filters,
      fulltext: dto.fulltext,
      linkTypeIds: dto.linkTypeIds,
      page: dto.page,
      pageSize: dto.pageSize,
      // TODO convert other fields as well
    };
  }

  public static toDto(model: QueryModel): Query {
    return {
      collectionIds: model.collectionIds,
      documentIds: model.documentIds,
      linkTypeIds: model.linkTypeIds,
      filters: model.filters,
      fulltext: model.fulltext,
      page: model.page,
      pageSize: model.pageSize,
      // TODO convert other fields as well
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

    query.collectionIds = query.collectionIds || [];
    query.documentIds = query.documentIds || [];
    query.filters = query.filters || [];
    query.linkTypeIds = query.linkTypeIds || [];
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

  public static parseFilter(filter: string): AttributeFilter {
    const [collectionId, attributeId, condition] = filter.split(':', 3);

    const [conditionTypeString, ...values] = condition.replace(/ +/g, ' ').split(' ');
    const value = values.join(' ');
    const conditionType = conditionFromString(conditionTypeString.trim().toLowerCase());
    if (conditionType == null) {
      return null;
    }

    return {collectionId, conditionType, attributeId, value};
  }
}
