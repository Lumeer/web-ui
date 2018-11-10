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
import {getCollectionsIdsFromFilters} from '../collections/collection.util';
import {QueryConverter} from '../navigation/query.converter';
import {AttributeFilter, ConditionType, QueryModel} from '../navigation/query.model';
import {UserModel} from '../users/user.model';
import {DocumentModel} from './document.model';
import {groupDocumentsByCollection, mergeDocuments} from './document.utils';

export function filterDocumentsByQuery(
  documents: DocumentModel[],
  query: QueryModel,
  currentUser: UserModel,
  includeChildren?: boolean
): DocumentModel[] {
  documents = documents.filter(document => typeof document === 'object').filter(document => document);

  if (!query || !containsDocumentsQueryField(query)) {
    return documents;
  }

  let filteredDocuments = filterDocumentsByDocumentsIds(documents, query.documentIds);
  filteredDocuments = mergeDocuments(
    filteredDocuments,
    filterDocumentsByFiltersAndFulltext(documents, query, currentUser, includeChildren)
  );

  return paginate(filteredDocuments, query);
}

function containsDocumentsQueryField(query: QueryModel): boolean {
  return (
    (query.collectionIds && query.collectionIds.length > 0) ||
    (query.documentIds && query.documentIds.length > 0) ||
    (query.filters && query.filters.length > 0) ||
    !!query.fulltext
  );
}

function filterDocumentsByDocumentsIds(documents: DocumentModel[], documentsIds: string[]): DocumentModel[] {
  if (!documentsIds || documentsIds.length === 0) {
    return [];
  }

  return documents.filter(document => documentsIds.includes(document.id));
}

function filterDocumentsByFiltersAndFulltext(
  documents: DocumentModel[],
  query: QueryModel,
  currentUser: UserModel,
  includeChildren?: boolean
): DocumentModel[] {
  const collectionIdsFromQuery = getCollectionIdsFromQuery(query);

  const documentsMap = includeChildren
    ? documents.reduce((docsMap, document) => ({...docsMap, [document.id]: document}), {})
    : {};

  if (collectionIdsFromQuery.length === 0 && query.fulltext) {
    return filterDocumentsByFulltext(documents, query.fulltext, documentsMap);
  }

  const documentsByCollectionsMap = groupDocumentsByCollection(documents);

  return collectionIdsFromQuery.reduce((filteredDocuments, collectionId) => {
    const documentsByCollection = documentsByCollectionsMap[collectionId] || [];
    return mergeDocuments(
      filteredDocuments,
      filterCollectionDocumentsByFiltersAndFulltext(documentsByCollection, query, currentUser, documentsMap)
    );
  }, []);
}

function getCollectionIdsFromQuery(query: QueryModel): string[] {
  const collectionsIds = query.collectionIds || [];
  return collectionsIds.concat(getCollectionsIdsFromFilters(query.filters));
}

function filterCollectionDocumentsByFiltersAndFulltext(
  documents: DocumentModel[],
  query: QueryModel,
  currentUser: UserModel,
  documentsMap: {[id: string]: DocumentModel}
): DocumentModel[] {
  if (hasFiltersAndFulltext(query)) {
    const filteredDocuments = filterDocumentsByFulltext(documents, query.fulltext, documentsMap);
    return filterDocumentsByFilters(filteredDocuments, query.filters, currentUser, documentsMap);
  } else if (query.fulltext) {
    return filterDocumentsByFulltext(documents, query.fulltext, documentsMap);
  } else if (query.filters && query.filters.length > 0) {
    return filterDocumentsByFilters(documents, query.filters, currentUser, documentsMap);
  }

  return documents;
}

function hasFiltersAndFulltext(query: QueryModel): boolean {
  return !!query.fulltext && (query.filters && query.filters.length > 0);
}

export function filterDocumentsByFulltext(
  documents: DocumentModel[],
  fulltext: string,
  documentsMap: {[id: string]: DocumentModel} = {}
): DocumentModel[] {
  if (!fulltext) {
    return [];
  }

  const matchingDocumentIds = new Set(
    documents
      .filter(document =>
        Object.values(document.data).some(value =>
          (value || '')
            .toString()
            .toLowerCase()
            .includes(fulltext.toLowerCase())
        )
      )
      .map(document => document.id)
  );

  return documents.filter(
    document =>
      matchingDocumentIds.has(document.id) || parentDocumentMatchesFulltext(document, matchingDocumentIds, documentsMap)
  );
}

function parentDocumentMatchesFulltext(
  document: DocumentModel,
  matchingDocumentIds: Set<string>,
  documentsMap: {[id: string]: DocumentModel}
): boolean {
  if (!document || !document.metaData || !document.metaData.parentId) {
    return false;
  }

  const parentDocument = documentsMap[document.metaData.parentId];
  if (!parentDocument) {
    return false;
  }

  return (
    matchingDocumentIds.has(parentDocument.id) ||
    parentDocumentMatchesFulltext(parentDocument, matchingDocumentIds, documentsMap)
  );
}

function filterDocumentsByFilters(
  documents: DocumentModel[],
  filters: string[],
  currentUser: UserModel,
  documentsMap: {[id: string]: DocumentModel}
): DocumentModel[] {
  if (!filters || filters.length === 0) {
    return [];
  }

  const attributeFilters = filters
    .map(filter => QueryConverter.parseFilter(filter))
    .filter(filter => !isNullOrUndefined(filter));

  return documents.filter(document => documentMeetsFilters(document, attributeFilters, currentUser, documentsMap));
}

function documentMeetsFilters(
  document: DocumentModel,
  filters: AttributeFilter[],
  currentUser: UserModel,
  documentsMap: {[id: string]: DocumentModel}
): boolean {
  return (
    filters.every(filter => documentMeetFilter(document, filter, currentUser)) ||
    parentDocumentMeetsFilters(document, filters, currentUser, documentsMap)
  );
}

function parentDocumentMeetsFilters(
  document: DocumentModel,
  filters: AttributeFilter[],
  currentUser: UserModel,
  documentsMap: {[id: string]: DocumentModel}
): boolean {
  if (!document.metaData || !document.metaData.parentId) {
    return false;
  }

  const parentDocument = documentsMap[document.metaData.parentId];
  return parentDocument && documentMeetsFilters(parentDocument, filters, currentUser, documentsMap);
}

function documentMeetFilter(document: DocumentModel, filter: AttributeFilter, currentUser: UserModel): boolean {
  if (document.collectionId !== filter.collectionId) {
    return true;
  }
  const dataValue = document.data[filter.attributeId];
  const filterValue = applyFilterFunctions(filter, currentUser);
  switch (filter.conditionType) {
    case ConditionType.Equals:
      return dataValue === filterValue;
    case ConditionType.NotEquals:
      return dataValue !== filterValue;
    case ConditionType.GreaterThan:
      return dataValue > filterValue;
    case ConditionType.GreaterThanEquals:
      return dataValue >= filterValue;
    case ConditionType.LowerThan:
      return dataValue < filterValue;
    case ConditionType.LowerThanEquals:
      return dataValue <= filterValue;
  }
  return true;
}

function paginate(documents: DocumentModel[], query: QueryModel) {
  if (isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}

function applyFilterFunctions(filter: AttributeFilter, currentUser: UserModel): any {
  switch (filter.value) {
    case 'userEmail()':
      return currentUser && currentUser.email;
    default:
      return filter.value;
  }
}
