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

import {Collection} from './collection';
import {DocumentModel} from '../documents/document.model';
import {mergeCollections} from './collection.util';
import {groupDocumentsByCollection} from '../documents/document.utils';
import {Query} from '../navigation/query';
import {LinkType} from '../link-types/link.type';
import {getAllCollectionIdsFromQuery, queryIsEmptyExceptPagination} from '../navigation/query.util';
import {filterDocumentsByFulltexts} from '../documents/documents.filters';

export function filterCollectionsByQuery(
  collections: Collection[],
  documents: DocumentModel[],
  linkTypes: LinkType[],
  query: Query
): Collection[] {
  const filteredCollections = collections.filter(collection => collection && typeof collection === 'object');
  if (!query || queryIsEmptyExceptPagination(query)) {
    return collections;
  }

  const collectionIds = getAllCollectionIdsFromQuery(query, linkTypes);
  const collectionsByIds = filteredCollections.filter(collection => collectionIds.includes(collection.id));

  const collectionsByFullTexts = filterCollectionsByFulltexts(filteredCollections, documents, query.fulltexts);

  return mergeCollections(collectionsByIds, collectionsByFullTexts);
}

function filterCollectionsByFulltexts(
  collections: Collection[],
  documents: DocumentModel[],
  fulltexts: string[]
): Collection[] {
  if (!fulltexts || fulltexts.length === 0) {
    return [];
  }

  const documentsByCollectionsMap = groupDocumentsByCollection(documents);

  return collections.filter(collection => {
    const documentByCollections = documentsByCollectionsMap[collection.id] || [];
    return (
      collectionMeetFulltexts(collection, fulltexts) ||
      filterDocumentsByFulltexts(documentByCollections, collection, fulltexts).length > 0
    );
  });
}

function collectionMeetFulltexts(collection: Collection, fulltexts: string[]): boolean {
  return (fulltexts || [])
    .map(fulltext => fulltext.toLowerCase())
    .every(fulltext => collection.name.toLowerCase().includes(fulltext));
}
