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

import {QueryItem} from '../../../query-item/model/query-item';
import {Collection} from '../../../../../../core/store/collections/collection';
import {QueryItemType} from '../../../query-item/model/query-item-type';
import {AttributeQueryItem} from '../../../query-item/model/attribute.query-item';
import {shiftArrayFromIndex} from '../../../../../utils/array.utils';
import {DocumentQueryItem} from '../../../query-item/model/documents.query-item';
import {CollectionQueryItem} from '../../../query-item/model/collection.query-item';
import {LinkQueryItem} from '../../../query-item/model/link.query-item';
import {getOtherLinkedCollectionId} from '../../../../../utils/link-type.utils';
import {View} from '../../../../../../core/store/views/view';
import {ViewQueryItem} from '../../../query-item/model/view.query-item';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {Suggestions} from './suggestions';
import {LinkAttributeQueryItem} from '../../../query-item/model/link-attribute.query-item';

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
  const linkTypeIdsChain = getLinkTypeIdsChainForStemItems(lastStemItems);
  const lastItem = lastStemItems[lastStemItems.length - 1];

  if (lastItem.type === QueryItemType.Collection || lastItem.type === QueryItemType.Link) {
    return createItemsByLinksPriority(suggestions, collectionIdsChain, linkTypeIdsChain);
  } else if (lastItem.type === QueryItemType.Attribute) {
    const lastAttrCollectionId = (lastItem as AttributeQueryItem).collection.id;
    const index = collectionIdsChain.findIndex(id => id === lastAttrCollectionId);
    const shiftedCollectionIds = shiftArrayFromIndex<string>(collectionIdsChain, index);
    const shiftedLinkTypeIds = shiftArrayFromIndex<string>(linkTypeIdsChain, index);
    return createItemsByAttributePriority(suggestions, collectionIdsChain, shiftedCollectionIds, shiftedLinkTypeIds);
  } else if (lastItem.type === QueryItemType.LinkAttribute) {
    const lastAttrLinkTypeId = (lastItem as LinkAttributeQueryItem).linkType.id;
    const index = linkTypeIdsChain.findIndex(id => id === lastAttrLinkTypeId);
    const shiftedCollectionIds = shiftArrayFromIndex<string>(collectionIdsChain, index + 1);
    const shiftedLinkTypeIds = shiftArrayFromIndex<string>(linkTypeIdsChain, index);
    return createItemsByAttributePriority(
      suggestions,
      collectionIdsChain,
      shiftedCollectionIds,
      shiftedLinkTypeIds,
      true
    );
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

function getLinkTypeIdsChainForStemItems(queryItems: QueryItem[]): string[] {
  if (!queryItems[0] || queryItems[0].type !== QueryItemType.Collection) {
    return [];
  }
  const chainIds = [];
  for (let i = 1; i < queryItems.length; i++) {
    if (queryItems[i].type !== QueryItemType.Link) {
      break;
    }
    chainIds.push((queryItems[i] as LinkQueryItem).linkType.id);
  }
  return chainIds;
}

function createAllQueryItems(suggestions: Suggestions, withViews?: boolean): QueryItem[] {
  return [
    ...createViewQueryItems(withViews ? suggestions.views : []),
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(suggestions.linkTypes),
    ...createAttributeQueryItems(suggestions.attributes),
    ...createLinkAttributesQueryItems(suggestions.linkAttributes),
  ];
}

function createCollectionQueryItems(collections: Collection[]): QueryItem[] {
  return collections.map(collection => new CollectionQueryItem(collection));
}

function createAttributeQueryItems(collections: Collection[]): QueryItem[] {
  return collections.reduce(
    (items, collection) => [...items, ...collection.attributes.map(a => new AttributeQueryItem(collection, a, '', ''))],
    []
  );
}

function createViewQueryItems(views: View[]): QueryItem[] {
  return views.map(view => new ViewQueryItem(view));
}

function createLinkQueryItems(linkTypes: LinkType[]): QueryItem[] {
  return linkTypes.map(linkType => new LinkQueryItem(linkType));
}

function createLinkAttributesQueryItems(linkTypes: LinkType[]): QueryItem[] {
  return linkTypes.reduce(
    (items, linkType) => [...items, ...linkType.attributes.map(a => new LinkAttributeQueryItem(linkType, a, '', ''))],
    []
  );
}

function createItemsByLinksPriority(
  suggestions: Suggestions,
  collectionIdsChain: string[],
  linkTypeIdsChain: string[]
): QueryItem[] {
  const lastCollectionId = collectionIdsChain[collectionIdsChain.length - 1];
  const splitLinks = splitLinkTypesForCollection(suggestions.linkTypes, lastCollectionId);
  const splitAttributeItems = splitAndSortAttributes(suggestions, collectionIdsChain, linkTypeIdsChain);

  return [
    ...createLinkQueryItems(splitLinks[0]),
    ...splitAttributeItems[0],
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(splitLinks[1]),
    ...splitAttributeItems[1],
  ];
}

function splitLinkTypesForCollection(linkTypes: LinkType[], collectionId: string): [LinkType[], LinkType[]] {
  const linkTypesByCollection = linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId));
  const otherLinkTypes = linkTypes.filter(linkType => !linkTypesByCollection.find(lt => lt.id === linkType.id));
  return [linkTypesByCollection, otherLinkTypes];
}

function splitAndSortAttributes(
  suggestions: Suggestions,
  collectionIdsChain: string[],
  linkTypeIdsChain: string[],
  linkFirst?: boolean
): [QueryItem[], QueryItem[]] {
  const attributes = suggestions.attributes;
  const linkAttributes = suggestions.linkAttributes;

  const usedAttributesIds = [];
  const usedLinkAttributesIds = [];
  const firstItems = [];
  for (let i = 0; i < Math.max(collectionIdsChain.length, linkTypeIdsChain.length); i++) {
    const collectionId = collectionIdsChain[i];
    const linkTypeId = linkTypeIdsChain[i];

    let attribute = null;
    if (collectionId) {
      attribute = attributes.find(collAttr => collAttr.id === collectionId);
      attribute && usedAttributesIds.push(attribute.id);
    }

    let linkAttribute = null;
    if (linkTypeId) {
      linkAttribute = linkAttributes.find(lta => lta.id === linkTypeId);
      linkAttribute && usedLinkAttributesIds.push(linkAttribute.id);
    }

    if (linkFirst) {
      linkAttribute && firstItems.push(...createLinkAttributesQueryItems([linkAttribute]));
      attribute && firstItems.push(...createAttributeQueryItems([attribute]));
    } else {
      attribute && firstItems.push(...createAttributeQueryItems([attribute]));
      linkAttribute && firstItems.push(...createLinkAttributesQueryItems([linkAttribute]));
    }
  }

  const otherAttributes = attributes.filter(attr => !usedAttributesIds.includes(attr.id));
  const otherLinkAttributes = linkAttributes.filter(attr => !usedLinkAttributesIds.includes(attr.id));
  const otherItems = [
    ...createAttributeQueryItems(otherAttributes),
    ...createLinkAttributesQueryItems(otherLinkAttributes),
  ];

  return [firstItems, otherItems];
}

function createItemsByAttributePriority(
  suggestions: Suggestions,
  originalCollectionIdsOrder: string[],
  shiftedCollectionIdsOrder: string[],
  shifterLinkTypeIdsOrder: string[],
  linkFirst?: boolean
): QueryItem[] {
  const lastCollectionId = originalCollectionIdsOrder[originalCollectionIdsOrder.length - 1];
  const splitLinks = splitLinkTypesForCollection(suggestions.linkTypes, lastCollectionId);
  const splitAttributeItems = splitAndSortAttributes(
    suggestions,
    shiftedCollectionIdsOrder,
    shifterLinkTypeIdsOrder,
    linkFirst
  );

  return [
    ...splitAttributeItems[0],
    ...createLinkQueryItems(splitLinks[0]),
    ...createCollectionQueryItems(suggestions.collections),
    ...createLinkQueryItems(splitLinks[1]),
    ...splitAttributeItems[1],
  ];
}

function createItemsByDocumentPriority(
  suggestions: Suggestions,
  collectionIdsOrder: string[],
  lastDocCollectionId: string
): QueryItem[] {
  return []; // TODO implement once we support documents in query
}
