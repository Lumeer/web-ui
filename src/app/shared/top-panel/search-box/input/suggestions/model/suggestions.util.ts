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

import {QueryItem} from '../../../query-item/model/query-item';
import {CollectionModel} from '../../../../../../core/store/collections/collection.model';
import {QueryItemType} from '../../../query-item/model/query-item-type';
import {AttributeQueryItem} from '../../../query-item/model/attribute.query-item';
import {shiftArray} from '../../../../../utils/array.utils';
import {DocumentQueryItem} from '../../../query-item/model/documents.query-item';
import {CollectionQueryItem} from '../../../query-item/model/collection.query-item';
import {LinkQueryItem} from '../../../query-item/model/link.query-item';
import {getOtherLinkedCollectionId} from '../../../../../utils/link-type.utils';
import {ViewModel} from '../../../../../../core/store/views/view.model';
import {ViewQueryItem} from '../../../query-item/model/view.query-item';
import {LinkTypeModel} from '../../../../../../core/store/link-types/link-type.model';
import {Suggestions} from './suggestions';

export function convertSuggestionsToQueryItemsSorted(suggestions: Suggestions, currentItems: QueryItem[]): QueryItem[] {
  if (!suggestions) {
    return [];
  }

  if (queryItemsAreEmpty(currentItems)) {
    return createAllQueryItems(suggestions, true);
  } else if (queryItemsAreEmptyExceptFulltexts(currentItems)) {
    return createAllQueryItems(suggestions);
  }

  const lastStemItems = filterLastQueryStemItems(currentItems);
  const collectionIdsChain = getCollectionIdsChainForStemItems(lastStemItems);
  const lastItem = lastStemItems[lastStemItems.length - 1];

  if (lastItem.type === QueryItemType.Collection || lastItem.type === QueryItemType.Link) {
    return createItemsByLinksPriority(suggestions, collectionIdsChain);
  } else if (lastItem.type === QueryItemType.Attribute) {
    const lastAttrCollectionId = (lastItem as AttributeQueryItem).collection.id;
    return createItemsByAttributePriority(suggestions, collectionIdsChain, lastAttrCollectionId);
  } else if (lastItem.type === QueryItemType.Document) {
    const lastDocCollectionId = (lastItem as DocumentQueryItem).document.collectionId;
    return createItemsByDocumentPriority(suggestions, collectionIdsChain, lastDocCollectionId);
  }

  return createAllQueryItems(suggestions);
}

function queryItemsAreEmpty(queryItems: QueryItem[]): boolean {
  return !queryItems || queryItems.length === 0;
}

function queryItemsAreEmptyExceptFulltexts(queryItems: QueryItem[]): boolean {
  return !queryItems || queryItems.filter(item => item.type !== QueryItemType.Fulltext).length === 0;
}

export function getCollectionIdsChainForItems(queryItems: QueryItem[]): string[] {
  const lastStemItems = filterLastQueryStemItems(queryItems);
  return getCollectionIdsChainForStemItems(lastStemItems);
}

function filterLastQueryStemItems(queryItems: QueryItem[]): QueryItem[] {
  if (queryItemsAreEmpty(queryItems)) {
    return [];
  }
  const lastCollectionIndex = findLastIndexOfCollectionItem(queryItems);
  return queryItems.slice(lastCollectionIndex).filter(item => item.type !== QueryItemType.Fulltext);
}

function findLastIndexOfCollectionItem(queryItems: QueryItem[]): number {
  let lastIndex = 0;
  for (let i = 0; i < queryItems.length; i++) {
    if (queryItems[i].type === QueryItemType.Collection) {
      lastIndex = i;
    }
  }
  return lastIndex;
}

function getCollectionIdsChainForStemItems(queryItems: QueryItem[]): string[] {
  if (!queryItems[0] || queryItems[0].type !== QueryItemType.Collection) {
    return [];
  }
  const chainIds = [(queryItems[0] as CollectionQueryItem).collection.id];
  for (let i = 1; i < queryItems.length; i++) {
    if (queryItems[i].type !== QueryItemType.Link) {
      break;
    }
    const linkItem = queryItems[i] as LinkQueryItem;
    const otherCollectionId = getOtherLinkedCollectionId(linkItem.linkType, chainIds[i - 1]);
    chainIds.push(otherCollectionId);
  }
  return chainIds;
}

function createAllQueryItems(suggestions: Suggestions, withViews?: boolean): QueryItem[] {
  return [
    ...createViewQueryItems(withViews ? suggestions.views : []),
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(suggestions.linkTypes),
    ...createAttributeQueryItems(suggestions.attributes),
  ];
}

function createCollectionQueryItems(collections: CollectionModel[]): QueryItem[] {
  return collections.map(collection => new CollectionQueryItem(collection));
}

function createAttributeQueryItems(collections: CollectionModel[]): QueryItem[] {
  return collections.reduce(
    (items, collection) => [...items, ...collection.attributes.map(a => new AttributeQueryItem(collection, a, '', ''))],
    []
  );
}

function createViewQueryItems(views: ViewModel[]): QueryItem[] {
  return views.map(view => new ViewQueryItem(view));
}

function createLinkQueryItems(linkTypes: LinkTypeModel[]): QueryItem[] {
  return linkTypes.map(linkType => new LinkQueryItem(linkType));
}

function createItemsByLinksPriority(suggestions: Suggestions, collectionIdsChain: string[]): QueryItem[] {
  const lastCollectionId = collectionIdsChain[collectionIdsChain.length - 1];
  const splitedLinks = splitLinkTypesForCollection(suggestions.linkTypes, lastCollectionId);
  const splitedAttributes = splitAndSortAttributesForCollections(suggestions.attributes, collectionIdsChain);

  return [
    ...createLinkQueryItems(splitedLinks[0]),
    ...createAttributeQueryItems(splitedAttributes[0]),
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(splitedLinks[1]),
    ...createAttributeQueryItems(splitedAttributes[1]),
  ];
}

function splitLinkTypesForCollection(
  linkTypes: LinkTypeModel[],
  collectionId: string
): [LinkTypeModel[], LinkTypeModel[]] {
  const linkTypesByCollection = linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId));
  const otherLinkTypes = linkTypes.filter(linkType => !linkTypesByCollection.find(lt => lt.id === linkType.id));
  return [linkTypesByCollection, otherLinkTypes];
}

function splitAndSortAttributesForCollections(
  attributes: CollectionModel[],
  collectionIdsOrder: string[]
): [CollectionModel[], CollectionModel[]] {
  const attributesByCollections: CollectionModel[] = [];
  for (let i = 0; i < collectionIdsOrder.length; i++) {
    const attributesByCollection = attributes.filter(collection => collection.id === collectionIdsOrder[i]);
    attributesByCollections.push(...attributesByCollection);
  }
  const otherAttributes = attributes.filter(
    collection => !attributesByCollections.find(coll => coll.id === collection.id)
  );
  return [attributesByCollections, otherAttributes];
}

function createItemsByAttributePriority(
  suggestions: Suggestions,
  collectionIdsOrder: string[],
  lastAttrCollectionId: string
): QueryItem[] {
  const lastCollectionId = collectionIdsOrder[collectionIdsOrder.length - 1];
  const splitedLinks = splitLinkTypesForCollection(suggestions.linkTypes, lastCollectionId);
  const shiftedIdsOrder = shiftArray<string>(collectionIdsOrder, lastAttrCollectionId);
  const splitedAttributes = splitAndSortAttributesForCollections(suggestions.attributes, shiftedIdsOrder);

  return [
    ...createAttributeQueryItems(splitedAttributes[0]),
    ...createLinkQueryItems(splitedLinks[0]),
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(splitedLinks[1]),
    ...createAttributeQueryItems(splitedAttributes[1]),
  ];
}

function createItemsByDocumentPriority(
  suggestions: Suggestions,
  collectionIdsOrder: string[],
  lastDocCollectionId: string
): QueryItem[] {
  return []; // TODO implement once we support documents in query
}
