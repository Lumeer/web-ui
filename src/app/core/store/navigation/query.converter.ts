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

import {Query} from '../../dto/query';
import {QueryModel} from './query.model';

export class QueryConverter {

  public static convertToModel(dto: Query): QueryModel {
    return {
      collectionCodes: dto.collectionCodes,
      filters: dto.filters,
      fulltext: dto.fulltext
      // TODO convert other fields as well
    };
  }

  public static convertToDto(model: QueryModel): Query {
    return {
      collectionCodes: model.collectionCodes,
      filters: model.filters,
      fulltext: model.fulltext
      // TODO convert other fields as well
    };
  }

}
