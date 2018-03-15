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
import {QueryModel} from '../navigation/query.model';
import {DocumentModel} from './document.model';

export class DocumentsFilters {

  public static filterByQuery(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
    documents = documents.filter(document => typeof(document) === 'object');
    if (!query) {
      return documents;
    }

    let filteredDocuments = this.filterByCollections(documents, query);
    filteredDocuments = this.filterByFulltext(filteredDocuments, query);
    return this.paginate(filteredDocuments, query);
  };

  private static filterByCollections(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
    if (!this.hasCollectionsFilter(query)) {
      return documents;
    }

    return documents.filter(document => {
      return query.collectionIds.includes(document.collectionId);
    });
  }

  private static hasCollectionsFilter(query: QueryModel): boolean {
    return query.collectionIds && query.collectionIds.length > 0;
  }

  private static filterByFulltext(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
    if (!query.fulltext) {
      return documents;
    }

    return documents.filter(document => Object.values(document.data).some(value => value.includes(query.fulltext)));
  }

  private static paginate(documents: DocumentModel[], query: QueryModel) {
    if (isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
      return documents;
    }

    return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
  }

}
