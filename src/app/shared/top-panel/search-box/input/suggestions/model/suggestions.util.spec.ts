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

import {Collection} from '../../../../../../core/store/collections/collection';
import {convertSuggestionsToQueryItemsSorted} from './suggestions.util';
import {View} from '../../../../../../core/store/views/view';
import {Perspective} from '../../../../../../view/perspectives/perspective';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {CollectionQueryItem} from '../../../query-item/model/collection.query-item';
import {AttributeQueryItem} from '../../../query-item/model/attribute.query-item';
import {ViewQueryItem} from '../../../query-item/model/view.query-item';
import {LinkQueryItem} from '../../../query-item/model/link.query-item';
import {FulltextQueryItem} from '../../../query-item/model/fulltext.query-item';

const collections: Collection[] = [
  {
    id: 'c1',
    name: 'lumeer',
    attributes: [],
  },
  {
    id: 'c2',
    name: 'sports',
    attributes: [],
  },
  {
    id: 'c3',
    name: 'whey',
    attributes: [],
  },
];
const collectionQueryItems = collections.map(c => new CollectionQueryItem(c));

const attributes: Collection[] = [
  {
    ...collections[0],
    attributes: [{id: 'a1', name: 'a1'}],
  },
  {
    ...collections[1],
    attributes: [{id: 'a2', name: 'a2'}],
  },
  {
    id: 'lala',
    name: 'lala',
    attributes: [{id: 'a2', name: 'a2'}],
  },
];
const attributeQueryItems = attributes.map(a => new AttributeQueryItem(a, a.attributes[0], '', ''));

const views: View[] = [
  {
    id: 'v1',
    name: 'v1',
    perspective: Perspective.Search,
    config: {},
    query: {},
  },
  {
    id: 'v2',
    name: 'v2',
    perspective: Perspective.Table,
    config: {},
    query: {},
  },
];
const viewsQueryItems = views.map(v => new ViewQueryItem(v));

const linkTypes: LinkType[] = [
  {
    id: 'l1',
    name: 'l1',
    collectionIds: [collections[0].id, collections[1].id],
    collections: [collections[0], collections[1]],
  },
  {
    id: 'l2',
    name: 'l2',
    collectionIds: [collections[2].id, collections[1].id],
    collections: [collections[2], collections[1]],
  },
];
const linkTypeQueryItems = linkTypes.map(l => new LinkQueryItem(l));

const fulltextQueryItems = [new FulltextQueryItem('la'), new FulltextQueryItem('he')];

describe('Suggestions util', () => {
  it('should filter undefined suggestions', () => {
    expect(convertSuggestionsToQueryItemsSorted(undefined, [])).toEqual([]);
  });

  it('should filter empty suggestions', () => {
    expect(
      convertSuggestionsToQueryItemsSorted({views: [], collections: [], attributes: [], linkTypes: []}, [])
    ).toEqual([]);
  });

  it('should filter empty current query items', () => {
    expect(convertSuggestionsToQueryItemsSorted({views, collections, attributes, linkTypes}, [])).toEqual([
      ...viewsQueryItems,
      ...collectionQueryItems,
      ...linkTypeQueryItems,
      ...attributeQueryItems,
    ]);
  });

  it('should filter with only fulltext query items', () => {
    expect(
      convertSuggestionsToQueryItemsSorted({views, collections, attributes, linkTypes}, fulltextQueryItems)
    ).toEqual([...collectionQueryItems, ...linkTypeQueryItems, ...attributeQueryItems]);
  });

  it('should filter with collection as last query item', () => {
    expect(
      convertSuggestionsToQueryItemsSorted({views, collections, attributes, linkTypes}, [
        collectionQueryItems[0],
        ...fulltextQueryItems,
      ])
    ).toEqual([
      linkTypeQueryItems[0],
      attributeQueryItems[0],
      ...collectionQueryItems,
      linkTypeQueryItems[1],
      ...attributeQueryItems.slice(1),
    ]);
  });

  it('should filter with link as last query item', () => {
    expect(
      convertSuggestionsToQueryItemsSorted({views, collections, attributes, linkTypes: [linkTypes[1]]}, [
        collectionQueryItems[0],
        linkTypeQueryItems[0],
        ...fulltextQueryItems,
      ])
    ).toEqual([
      linkTypeQueryItems[1],
      ...attributeQueryItems.slice(0, 2),
      ...collectionQueryItems,
      attributeQueryItems[2],
    ]);
  });

  it('should filter with attribute as last query item', () => {
    expect(
      convertSuggestionsToQueryItemsSorted({views, collections, attributes, linkTypes: [linkTypes[1]]}, [
        collectionQueryItems[0],
        linkTypeQueryItems[0],
        attributeQueryItems[1],
        ...fulltextQueryItems,
      ])
    ).toEqual([
      attributeQueryItems[1],
      attributeQueryItems[0],
      linkTypeQueryItems[1],
      ...collectionQueryItems,
      attributeQueryItems[2],
    ]);
  });
});
