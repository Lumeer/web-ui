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
import {QueryConverter} from '../navigation/query.converter';
import {groupDocumentsByCollection, mergeDocuments} from './document.utils';
import {getCollectionIdsFromFilters} from '../collections/collection.util';

export function filterDocumentsByQuery(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  documents = documents.filter(document => typeof(document) === 'object')
    .filter(document => document);

  if (!query || !containsDocumentsQueryField(query)) {
    return documents;
  }

  let filteredDocuments = filterDocumentsByDocumentsIds(documents, query.documentIds);
  filteredDocuments = mergeDocuments(filteredDocuments, filterDocumentsByFiltersAndFulltext(documents, query));

  return paginate(filteredDocuments, query);
}

function containsDocumentsQueryField(query: QueryModel): boolean {
  return (query.collectionIds && query.collectionIds.length > 0)
    || (query.documentIds && query.documentIds.length > 0)
    || (query.filters && query.filters.length > 0) || !!query.fulltext;
}

function filterDocumentsByDocumentsIds(documents: DocumentModel[], documentsIds: string[]): DocumentModel[] {
  if (!documentsIds || documentsIds.length === 0) {
    return [];
  }

  return documents.filter(document => documentsIds.includes(document.id));
}

function filterDocumentsByFiltersAndFulltext(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  const collectionIdsFromQuery = getCollectionIdsFromQuery(query);

  if (collectionIdsFromQuery.length === 0 && query.fulltext) {
    return filterDocumentsByFulltext(documents, query.fulltext);
  }

  let filteredDocuments = [];
  const documentsByCollectionsMap = groupDocumentsByCollection(documents);

  for (let collectionId of collectionIdsFromQuery) {
    const documentsByCollection = documentsByCollectionsMap[collectionId];
    filteredDocuments = mergeDocuments(filteredDocuments, filterCollectionDocumentsByFiltersAndFulltext(documentsByCollection, query));
  }

  return filteredDocuments;
}

function getCollectionIdsFromQuery(query: QueryModel): string[] {
  let collectionsIds = query.collectionIds || [];
  return collectionsIds.concat(getCollectionIdsFromFilters(query.filters));
}

function filterCollectionDocumentsByFiltersAndFulltext(documents: DocumentModel[], query: QueryModel): DocumentModel[] {
  if (hasFiltersAndFulltext(query)) {
    const filteredDocuments = filterDocumentsByFulltext(documents, query.fulltext);
    return filterDocumentsByFilters(filteredDocuments, query.filters);
  } else if (query.fulltext) {
    return filterDocumentsByFulltext(documents, query.fulltext);
  } else if (query.filters && query.filters.length > 0) {
    return filterDocumentsByFilters(documents, query.filters);
  }

  return documents;
}

function hasFiltersAndFulltext(query: QueryModel): boolean {
  return !!query.fulltext && (query.filters && query.filters.length > 0);
}

export function filterDocumentsByFulltext(documents: DocumentModel[], fulltext: string): DocumentModel[] {
  if (!fulltext) {
    return [];
  }

  return documents.filter(document => Object.values(document.data).some(value => (value || '').toString().toLowerCase()
    .includes(fulltext.toLowerCase())));
}

function filterDocumentsByFilters(documents: DocumentModel[], filters: string[]): DocumentModel[] {
  if (!filters || filters.length === 0) {
    return [];
  }

  const attributeFilters = filters.map(filter => QueryConverter.parseFilter(filter))
    .filter(filter => !isNullOrUndefined(filter));

  return documents.filter(document => documentMeetsFilters(document, attributeFilters));
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

function paginate(documents: DocumentModel[], query: QueryModel) {
  if (isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}
