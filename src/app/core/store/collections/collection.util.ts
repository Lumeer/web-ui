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
import {QueryConverter} from '../navigation/query.converter';
import {ViewModel} from '../views/view.model';
import {LinkTypeModel} from '../link-types/link-type.model';
import {DocumentModel} from '../documents/document.model';

export function getDefaultAttributeId(collection: CollectionModel): string {
  if (collection.defaultAttributeId) {
    const defaultAttribute = collection.attributes.find(attr => attr.id === collection.defaultAttributeId);
    if (defaultAttribute) {
      return collection.defaultAttributeId;
    }
  }

  const attributes = collection.attributes || [];
  if (attributes.length > 0) {
    return attributes[0].id;
  }

  return '';
}

export function sortCollectionsByFavoriteAndLastUsed(collections: CollectionModel[]): CollectionModel[] {
  return collections.sort((a, b) => {
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      return b.lastTimeUsed.getTime() - a.lastTimeUsed.getTime();
    }
    return a.favorite ? -1 : 1;
  });
}

export function mergeCollections(collectionsA: CollectionModel[], collectionsB: CollectionModel[]): CollectionModel[] {
  const collectionsAIds = collectionsA.map(collection => collection.id);
  const collectionsBToAdd = collectionsB.filter(collection => !collectionsAIds.includes(collection.id));
  return collectionsA.concat(collectionsBToAdd);
}

export function getCollectionsIdsFromView(
  view: ViewModel,
  linkTypes: LinkTypeModel[],
  documents: DocumentModel[]
): string[] | null {
  if (!view) {
    return null;
  }

  const query = view.query || {};
  const collectionIds = [...((query && query.collectionIds) || [])];
  collectionIds.push(...getCollectionsIdsFromFilters(query.filters));

  const linkTypesFromView = (query.linkTypeIds || [])
    .map(id => linkTypes.find(linkType => linkType.id === id))
    .filter(linkType => !!linkType);

  collectionIds.push(...getCollectionsIdsFromLinkTypes(linkTypesFromView));

  const documentsFromView = (query.documentIds || [])
    .map(id => documents.find(document => document.id === id))
    .filter(document => !!document);

  collectionIds.push(...getCollectionsIdsFromDocuments(documentsFromView));

  return collectionIds;
}

export function getCollectionsIdsFromFilters(filters: string[]): string[] {
  if (!filters) {
    return [];
  }
  return (
    (filters &&
      filters
        .map(filter => QueryConverter.parseFilter(filter))
        .filter(filter => !!filter)
        .map(filter => filter.collectionId)) ||
    []
  );
}

function getCollectionsIdsFromLinkTypes(linkTypes: LinkTypeModel[]): string[] {
  if (!linkTypes) {
    return [];
  }
  return linkTypes.reduce((ids, linkType) => {
    ids.push(...linkType.collectionIds);
    return ids;
  }, []);
}

export function getCollectionsIdsFromDocuments(documents: DocumentModel[]): string[] {
  if (!documents) {
    return [];
  }

  return documents.reduce((ids, document) => {
    if (!ids.includes(document.collectionId)) {
      ids.push(document.collectionId);
    }
    return ids;
  }, []);
}
