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

import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {CollectionQueryItem} from '../query-item/model/collection.query-item';
import {LinkQueryItem} from '../query-item/model/link.query-item';
import {FulltextQueryItem} from '../query-item/model/fulltext.query-item';
import {AttributeQueryItem} from '../query-item/model/attribute.query-item';
import {LinkAttributeQueryItem} from '../query-item/model/link-attribute.query-item';
import {addQueryItemWithRelatedItems, removeQueryItemWithRelatedItems} from './search-box.util';
import {QueryItemType} from '../query-item/model/query-item-type';

const collections: Collection[] = [
  {
    id: 'c1',
    name: 'lumeer',
    attributes: [{id: 'a1', name: 'a1'}],
  },
  {
    id: 'c2',
    name: 'sports',
    attributes: [{id: 'a2', name: 'a2'}],
  },
  {
    id: 'c3',
    name: 'whey',
    attributes: [{id: 'a3', name: 'a3'}],
  },
  {
    id: 'x1',
    name: 'lala',
    attributes: [{id: 'x1', name: 'x1'}, {id: 'x2', name: 'x2'}],
  },
  {
    id: 'x2',
    name: 'lala2',
    attributes: [{id: 'x2', name: 'x2'}],
  },
  {
    id: 'x3',
    name: 'lala3',
    attributes: [{id: 'x2', name: 'x2'}],
  },
  {
    id: 'x4',
    name: 'lala4',
    attributes: [{id: 'x4', name: 'x4'}],
  },
];

const linkTypes: LinkType[] = [
  {
    id: 'l12',
    name: 'l12',
    collectionIds: [collections[0].id, collections[1].id],
    collections: [collections[0], collections[1]],
    attributes: [{id: 'a1', name: 'a1'}],
  },
  {
    id: 'l23',
    name: 'l23',
    collectionIds: [collections[1].id, collections[2].id],
    collections: [collections[1], collections[2]],
    attributes: [{id: 'a2', name: 'a2'}],
  },
  {
    id: 'x12',
    name: 'x12',
    collectionIds: [collections[3].id, collections[4].id],
    collections: [collections[3], collections[4]],
    attributes: [{id: 'x1', name: 'x1'}, {id: 'x2', name: 'x2'}],
  },
  {
    id: 'x34',
    name: 'x34',
    collectionIds: [collections[5].id, collections[6].id],
    collections: [collections[5], collections[6]],
    attributes: [{id: 'x1', name: 'x1'}],
  },
];

const queryData = {collections, linkTypes};

const queryItems = [
  new CollectionQueryItem(collections[3]),
  new LinkQueryItem(linkTypes[2]),
  new AttributeQueryItem(collections[3], collections[3].attributes[0], '', ''),
  new LinkAttributeQueryItem(linkTypes[2], linkTypes[2].attributes[0], '', ''),
  new AttributeQueryItem(collections[4], collections[4].attributes[0], '', ''),
  new CollectionQueryItem(collections[0]),
  new LinkQueryItem(linkTypes[0]),
  new FulltextQueryItem('text'),
  new FulltextQueryItem('qcd'),
];

fdescribe('Search box util', () => {
  fit('should add fulltext item on the end', () => {
    const fulltextItem = new FulltextQueryItem('pp');
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, fulltextItem);
    expect(newQueryItems[newQueryItems.length - 1]).toEqual(fulltextItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 1);
  });

  fit('should add collection item before fulltexts', () => {
    const collectionItem = new CollectionQueryItem(collections[4]);
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, collectionItem);
    expect(newQueryItems[newQueryItems.length - 3]).toEqual(collectionItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 1);
  });

  fit('should add link item', () => {
    const linkItem = new LinkQueryItem(linkTypes[1]);
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, linkItem);
    expect(newQueryItems[newQueryItems.length - 3]).toEqual(linkItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 1);
  });

  fit('should add attribute', () => {
    const attributeItem = new AttributeQueryItem(collections[3], collections[3].attributes[1], '', '');
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, attributeItem);
    expect(newQueryItems[3]).toEqual(attributeItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 1);
  });

  fit('should add attribute with collection', () => {
    const attributeItem = new AttributeQueryItem(collections[5], collections[5].attributes[0], '', '');
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, attributeItem);
    expect(newQueryItems[newQueryItems.length - 4]).toEqual(new CollectionQueryItem(collections[5]));
    expect(newQueryItems[newQueryItems.length - 3]).toEqual(attributeItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 2);
  });

  fit('should add link attribute', () => {
    const linkAttributeItem = new LinkAttributeQueryItem(linkTypes[2], linkTypes[2].attributes[1], '', '');
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, linkAttributeItem);
    expect(newQueryItems[4]).toEqual(linkAttributeItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 1);
  });

  fit('should add link attribute with collection and link', () => {
    const linkAttributeItem = new LinkAttributeQueryItem(linkTypes[3], linkTypes[3].attributes[0], '', '');
    const newQueryItems = addQueryItemWithRelatedItems(queryData, queryItems, linkAttributeItem);
    expect(newQueryItems[newQueryItems.length - 5]).toEqual(new CollectionQueryItem(collections[5]));
    expect(newQueryItems[newQueryItems.length - 4]).toEqual(new LinkQueryItem(linkTypes[3]));
    expect(newQueryItems[newQueryItems.length - 3]).toEqual(linkAttributeItem);
    expect(newQueryItems.length).toEqual(queryItems.length + 3);
  });

  fit('should remove fulltext', () => {
    const newQueryItems = removeQueryItemWithRelatedItems(queryData, queryItems, queryItems.length - 2);
    expect(newQueryItems[newQueryItems.length - 2].type === QueryItemType.Fulltext).toBeFalsy();
    expect(newQueryItems.length).toEqual(queryItems.length - 1);
  });

  fit('should remove collection', () => {
    const newQueryItems = removeQueryItemWithRelatedItems(queryData, queryItems, 0);
    expect(newQueryItems[0]).toEqual(new CollectionQueryItem(collections[0]));
    expect(newQueryItems.length).toEqual(queryItems.length - 5);
  });

  fit('should remove attribute', () => {
    const newQueryItems = removeQueryItemWithRelatedItems(queryData, queryItems, 2);
    expect(newQueryItems[2].type === QueryItemType.Attribute).toBeFalsy();
    expect(newQueryItems.length).toEqual(queryItems.length - 1);
  });

  fit('should remove link attribute', () => {
    const newQueryItems = removeQueryItemWithRelatedItems(queryData, queryItems, 3);
    expect(newQueryItems[3].type === QueryItemType.LinkAttribute).toBeFalsy();
    expect(newQueryItems.length).toEqual(queryItems.length - 1);
  });

  fit('should remove link', () => {
    const newQueryItems = removeQueryItemWithRelatedItems(queryData, queryItems, 1);
    expect(newQueryItems[1].type).toEqual(QueryItemType.Attribute);
    expect(newQueryItems[2]).toEqual(new CollectionQueryItem(collections[0]));
    expect(newQueryItems.length).toEqual(queryItems.length - 3);
  });
});
