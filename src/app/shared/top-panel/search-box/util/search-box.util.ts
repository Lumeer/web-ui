/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {QueryItem} from '../query-item/model/query-item';
import {QueryItemType} from '../query-item/model/query-item-type';
import {LinkQueryItem} from '../query-item/model/link.query-item';
import {AttributeQueryItem} from '../query-item/model/attribute.query-item';
import {DocumentQueryItem} from '../query-item/model/documents.query-item';
import {QueryData} from './query-data';
import {CollectionQueryItem} from '../query-item/model/collection.query-item';
import {convertQueryItemsToQueryModel, QueryItemsConverter} from '../query-item/query-items.converter';
import {
  filterStemByLinkIndex,
  findStemIndexForCollection,
  findStemIndexForLinkType,
  findStemIndexForLinkTypeToJoin,
} from '../../../../core/store/navigation/query/query.util';
import {LinkAttributeQueryItem} from '../query-item/model/link-attribute.query-item';

export function addQueryItemWithRelatedItems(
  queryData: QueryData,
  queryItems: QueryItem[],
  queryItem: QueryItem
): QueryItem[] {
  switch (queryItem.type) {
    case QueryItemType.Collection:
      return addItemBeforeFulltexts(queryItems, queryItem);
    case QueryItemType.Link:
      return addLinkItem(queryData, queryItems, queryItem as LinkQueryItem);
    case QueryItemType.Attribute:
      return addAttributeItem(queryData, queryItems, queryItem as AttributeQueryItem);
    case QueryItemType.LinkAttribute:
      return addLinkAttributeItem(queryData, queryItems, queryItem as LinkAttributeQueryItem);
    case QueryItemType.Document:
      return addDocumentItem(queryData, queryItems, queryItem as DocumentQueryItem);
    case QueryItemType.Fulltext:
      return addItemToEnd(queryItems, queryItem);
    case QueryItemType.View:
      return addItemToEnd(queryItems, queryItem);
  }
}

function addItemBeforeFulltexts(queryItems: QueryItem[], queryItem: QueryItem): QueryItem[] {
  const fulltextIndex = queryItems.findIndex(qi => qi.type === QueryItemType.Fulltext);
  const insertIndex = fulltextIndex !== -1 ? fulltextIndex : queryItems.length;
  return addQueryItemAtIndex(queryItems, queryItem, insertIndex);
}

function addQueryItemAtIndex(queryItems: QueryItem[], queryItem: QueryItem, index: number): QueryItem[] {
  const currentQueryItems = [...queryItems];
  currentQueryItems.splice(index, 0, queryItem);
  return currentQueryItems;
}

function addItemToEnd(queryItems: QueryItem[], queryItem: QueryItem): QueryItem[] {
  return addQueryItemAtIndex(queryItems, queryItem, queryItems.length);
}

function addLinkItem(queryData: QueryData, queryItems: QueryItem[], linkItem: LinkQueryItem): QueryItem[] {
  const query = convertQueryItemsToQueryModel(queryItems);
  const linkType = linkItem.linkType;
  const stemIndex = findStemIndexForLinkTypeToJoin(query, linkType, queryData.linkTypes);
  if (stemIndex >= 0) {
    const stem = query.stems[stemIndex];
    if (stem.linkTypeIds) {
      stem.linkTypeIds.push(linkType.id);
    } else {
      stem.linkTypeIds = [linkType.id];
    }
  } else {
    query.stems.push({collectionId: linkType.collectionIds[0], linkTypeIds: [linkType.id]});
  }

  return new QueryItemsConverter(queryData).fromQuery(query);
}

function addAttributeItem(
  queryData: QueryData,
  queryItems: QueryItem[],
  attributeItem: AttributeQueryItem
): QueryItem[] {
  const query = convertQueryItemsToQueryModel(queryItems);
  const collectionId = attributeItem.collection.id;
  const attributeFilter = attributeItem.getAttributeFilter();
  const stemIndex = findStemIndexForCollection(query, collectionId, queryData.linkTypes);
  if (stemIndex >= 0) {
    const stem = query.stems[stemIndex];
    if (stem.filters) {
      stem.filters.push(attributeFilter);
    } else {
      stem.filters = [attributeFilter];
    }
  } else {
    query.stems.push({collectionId, filters: [attributeFilter]});
  }

  return new QueryItemsConverter(queryData).fromQuery(query).map(item => {
    if (item.type === attributeItem.type && item.value === attributeItem.value) {
      item.fromSuggestion = attributeItem.fromSuggestion;
    }
    return item;
  });
}

function addLinkAttributeItem(
  queryData: QueryData,
  queryItems: QueryItem[],
  attributeItem: LinkAttributeQueryItem
): QueryItem[] {
  const query = convertQueryItemsToQueryModel(queryItems);
  const linkTypeId = attributeItem.linkType.id;
  const linkAttributeFilter = attributeItem.getLinkAttributeFilter();
  const stemIndex = findStemIndexForLinkType(query, linkTypeId);
  if (stemIndex >= 0) {
    const stem = query.stems[stemIndex];
    if (stem.linkFilters) {
      stem.linkFilters.push(linkAttributeFilter);
    } else {
      stem.linkFilters = [linkAttributeFilter];
    }
  } else {
    const joinIndex = findStemIndexForLinkTypeToJoin(query, attributeItem.linkType, queryData.linkTypes);
    if (joinIndex >= 0) {
      const stem = query.stems[joinIndex];
      if (stem.linkTypeIds) {
        stem.linkTypeIds.push(attributeItem.linkType.id);
      } else {
        stem.linkTypeIds = [attributeItem.linkType.id];
      }
      if (stem.linkFilters) {
        stem.linkFilters.push(linkAttributeFilter);
      } else {
        stem.linkFilters = [linkAttributeFilter];
      }
    } else {
      query.stems.push({
        collectionId: attributeItem.collectionIds[0],
        linkTypeIds: [linkTypeId],
        linkFilters: [linkAttributeFilter],
      });
    }
  }

  return new QueryItemsConverter(queryData).fromQuery(query).map(item => {
    if (item.type === attributeItem.type && item.value === attributeItem.value) {
      item.fromSuggestion = attributeItem.fromSuggestion;
    }
    return item;
  });
}

function addDocumentItem(queryData: QueryData, queryItems: QueryItem[], documentItem: DocumentQueryItem): QueryItem[] {
  const query = convertQueryItemsToQueryModel(queryItems);
  const {id, collectionId} = documentItem.document;
  const stemIndex = findStemIndexForCollection(query, collectionId, queryData.linkTypes);
  if (stemIndex >= 0) {
    const stem = query.stems[stemIndex];
    if (stem.documentIds) {
      stem.documentIds.push(id);
    } else {
      stem.documentIds = [id];
    }
  } else {
    query.stems.push({collectionId, documentIds: [id]});
  }

  return new QueryItemsConverter(queryData).fromQuery(query);
}

export function removeQueryItemWithRelatedItems(
  queryData: QueryData,
  queryItems: QueryItem[],
  index: number
): QueryItem[] {
  if (queryItems.length <= index) {
    return queryItems;
  }
  const queryItem = queryItems[index];

  switch (queryItem.type) {
    case QueryItemType.Collection:
      return removeCollectionStem(queryData, queryItems, index);
    case QueryItemType.Link:
      return removeLinkChainFromStem(queryData, queryItems, index);
    case QueryItemType.Attribute:
    case QueryItemType.LinkAttribute:
    case QueryItemType.Document:
    case QueryItemType.Deleted:
    case QueryItemType.Fulltext:
      return removeQueryItem(queryItems, index);
  }
}

function removeCollectionStem(queryData: QueryData, queryItems: QueryItem[], index: number): QueryItem[] {
  const stemIndex = getStemIndexByCollectionItemIndex(queryItems, index);
  const currentQuery = convertQueryItemsToQueryModel(queryItems);
  currentQuery.stems.splice(stemIndex, 1);

  return new QueryItemsConverter(queryData).fromQuery(currentQuery);
}

function getStemIndexByCollectionItemIndex(queryItems: QueryItem[], collectionIndex: number): number {
  return queryItems.slice(0, collectionIndex).filter(item => item.type === QueryItemType.Collection).length;
}

function removeLinkChainFromStem(queryData: QueryData, queryItems: QueryItem[], linkIndex: number): QueryItem[] {
  const stemData = getStemCollectionIdForLinkIndex(queryItems, linkIndex);
  if (!stemData) {
    return;
  }
  const {collectionIndex} = stemData;
  const stemIndex = getStemIndexByCollectionItemIndex(queryItems, collectionIndex);
  const currentQuery = convertQueryItemsToQueryModel(queryItems);

  currentQuery.stems[stemIndex] = filterStemByLinkIndex(
    currentQuery.stems[stemIndex],
    linkIndex - (collectionIndex + 1),
    queryData.linkTypes
  );
  return new QueryItemsConverter(queryData).fromQuery(currentQuery);
}

function getStemCollectionIdForLinkIndex(
  queryItems: QueryItem[],
  index: number
): {collectionId: string; collectionIndex: number} {
  let collectionIndex = index;
  let currentItem: QueryItem = queryItems[index];
  while (currentItem.type === QueryItemType.Link && collectionIndex >= 0) {
    collectionIndex--;
    currentItem = queryItems[collectionIndex];
  }

  if (collectionIndex < 0 || currentItem.type !== QueryItemType.Collection) {
    return null;
  }

  return {collectionId: (currentItem as CollectionQueryItem).collection.id, collectionIndex};
}

function removeQueryItem(queryItems: QueryItem[], index: number): QueryItem[] {
  const queryItemsCopy = [...queryItems];
  queryItemsCopy.splice(index, 1);
  return queryItemsCopy;
}
