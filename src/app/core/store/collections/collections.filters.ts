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

import {CollectionModel} from './collection.model';
import {QueryModel} from '../navigation/query.model';
import {DocumentModel} from '../documents/document.model';
import {getCollectionsIdsFromFilters, mergeCollections} from './collection.util';
import {groupDocumentsByCollection} from '../documents/document.utils';
import {filterDocumentsByFulltext} from '../documents/documents.filters';

export function filterCollectionsByQuery(
  collections: CollectionModel[],
  documents: DocumentModel[],
  query: QueryModel
): CollectionModel[] {
  collections = collections.filter(collection => typeof collection === 'object');

  if (!query || !containsCollectionsQueryField(query)) {
    return collections;
  }

  let filteredCollections = filterCollectionsByFulltext(collections, documents, query.fulltext);
  filteredCollections = mergeCollections(
    filteredCollections,
    filterCollectionsByCollectionIds(collections, query.collectionIds)
  );
  filteredCollections = mergeCollections(filteredCollections, filterCollectionsByFilters(collections, query.filters));
  filteredCollections = mergeCollections(
    filteredCollections,
    filterCollectionsByDocumentsIds(collections, documents, query.documentIds)
  );

  return filteredCollections;
}

function containsCollectionsQueryField(query: QueryModel): boolean {
  return (
    (query.collectionIds && query.collectionIds.length > 0) ||
    (query.documentIds && query.documentIds.length > 0) ||
    (query.filters && query.filters.length > 0) ||
    !!query.fulltext
  );
}

function filterCollectionsByFulltext(
  collections: CollectionModel[],
  documents: DocumentModel[],
  fulltext: string
): CollectionModel[] {
  if (!fulltext) {
    return [];
  }

  const documentsByCollectionsMap = groupDocumentsByCollection(documents);

  return collections.filter(collection => {
    const documentByCollections = documentsByCollectionsMap[collection.id] || [];
    return filterDocumentsByFulltext(documentByCollections, fulltext).length > 0;
  });
}

function filterCollectionsByCollectionIds(collections: CollectionModel[], collectionIds: string[]): CollectionModel[] {
  if (!collections || collectionIds.length === 0) {
    return [];
  }

  return collections.filter(collection => collectionIds.includes(collection.id));
}

function filterCollectionsByFilters(collections: CollectionModel[], filters: string[]): CollectionModel[] {
  if (!filters || filters.length === 0) {
    return [];
  }

  const collectionIdsFromFilters = getCollectionsIdsFromFilters(filters);

  return filterCollectionsByCollectionIds(collections, collectionIdsFromFilters);
}

function filterCollectionsByDocumentsIds(
  collections: CollectionModel[],
  documents: DocumentModel[],
  documentsIds: string[]
): CollectionModel[] {
  if (!documentsIds || documentsIds.length === 0) {
    return [];
  }

  const collectionsIdsFromDocuments = documents.reduce((collectionIds, document) => {
    if (documentsIds.includes(document.id) && !collectionIds.includes(document.collectionId)) {
      collectionIds.push(document.collectionId);
    }

    return collectionIds;
  }, []);

  return filterCollectionsByCollectionIds(collections, collectionsIdsFromDocuments);
}
