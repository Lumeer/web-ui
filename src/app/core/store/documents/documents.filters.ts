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
import {AttributeFilter, ConditionType, QueryModel} from '../navigation/query.model';
import {DocumentModel} from './document.model';
import {QueryConverter} from "../navigation/query.converter";

export function filterDocumentsByQuery(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  documents = documents.filter(document => typeof(document) === 'object')
    .filter(document => document);
  if (!query) {
    return documents;
  }

  let filteredDocuments = filterDocumentsByCollections(documents, query);
  filteredDocuments = filterDocumentsByFulltext(filteredDocuments, query);
  filteredDocuments = filterDocumentsByFilters(filteredDocuments, query);

  return paginate(filteredDocuments, query);
}

function filterDocumentsByCollections(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  if (!hasCollectionsFilter(query)) {
    return documents;
  }

  return documents.filter(document => {
    return query.collectionIds.includes(document.collectionId);
  });
}

function filterDocumentsByFulltext(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  if (!query.fulltext) {
    return documents;
  }

  return documents.filter(document => Object.values(document.data).some(value => value.includes(query.fulltext)));
}

function filterDocumentsByFilters(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  if (!query.filters || query.filters.length == 0) {
    return documents;
  }

  const filters = query.filters.map(filter => QueryConverter.parseFilter(filter))
    .filter(filter => !isNullOrUndefined(filter));

  return documents.filter(document => documentMeetsFilters(document, filters));
}

function documentMeetsFilters(document: DocumentModel, filters: AttributeFilter[]): boolean {
  return filters.every(filter => documentMeetFilter(document, filter));
}

function documentMeetFilter(document: DocumentModel, filter: AttributeFilter): boolean {
  if (document.collectionId !== filter.collectionId) {
    return true;
  }
  const data = document.data[filter.attributeId];
  switch (filter.conditionType) {
    case ConditionType.Equals:
      return data === filter.value;
    case ConditionType.NotEquals:
      return data !== filter.value;
    case ConditionType.GreaterThan:
      return data > filter.value;
    case ConditionType.GreaterThanEquals:
      return data >= filter.value;
    case ConditionType.LowerThan:
      return data < filter.value;
    case ConditionType.LowerThanEquals:
      return data <= filter.value;
  }
  return true;
}

function hasCollectionsFilter(query: QueryModel): boolean {
  return query.collectionIds && query.collectionIds.length > 0;
}

function paginate(documents: DocumentModel[], query: QueryModel) {
  if (isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}

