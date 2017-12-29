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

import {Query} from '../../../../core/dto';
import {QueryConverter} from '../../../../core/store/navigation/query.converter';
import {QueryModel} from '../../../../core/store/navigation/query.model';

export class QueryManager {

  private query: Query;

  constructor(queryModel: QueryModel, private getDocumentsPerRow: () => number) {
    this.query = QueryConverter.toDto(queryModel);
  }

  public getQuery(): Query {
    return this.query;
  }

  public hasQuery(): boolean {
    return Boolean(this.query);
  }

  public currentCollectionCode(): string {
    if (!this.query || !this.query.collectionCodes) {
      return null;
    }

    return this.query.collectionCodes[0];
  }

  public queryWithPagination(pageNumber: number, editable: boolean): QueryModel {
    const queryWithPagination = {...this.query};
    queryWithPagination.page = pageNumber;
    queryWithPagination.pageSize = this.pageSize(editable, pageNumber);
    return QueryConverter.fromDto(queryWithPagination);
  }

  private pageSize(editable: boolean, pageNumber: number): number {
    const addDocumentOffset = Number(editable && pageNumber === 0);
    return this.getDocumentsPerRow() * 3 - addDocumentOffset;
  }
}
