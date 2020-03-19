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

import {LinkQueryItem} from './model/link.query-item';
import {convertQueryModelToString} from '../../../../core/store/navigation/query/query.converter';
import {QueryData} from '../util/query-data';
import {AttributeQueryItem} from './model/attribute.query-item';
import {CollectionQueryItem} from './model/collection.query-item';
import {DocumentQueryItem} from './model/documents.query-item';
import {FulltextQueryItem} from './model/fulltext.query-item';
import {QueryItem} from './model/query-item';
import {QueryItemType} from './model/query-item-type';
import {DeletedQueryItem} from './model/deleted.query-item';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {isNotNullOrUndefined} from '../../../utils/common.utils';
import {collectionIdsChainForStem} from '../../../../core/store/navigation/query/query.util';
import {LinkAttributeQueryItem} from './model/link-attribute.query-item';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Collection} from '../../../../core/store/collections/collection';

export function convertQueryItemsToString(queryItems: QueryItem[]): string {
  return convertQueryModelToString(convertQueryItemsToQueryModel(queryItems));
}

export function convertQueryItemsToQueryModel(queryItems: QueryItem[]): Query {
  const query: Query = {
    stems: [],
    fulltexts: [],
  };

  queryItems.forEach(queryItem => {
    switch (queryItem.type) {
      case QueryItemType.Collection:
        query.stems.push({
          collectionId: (queryItem as CollectionQueryItem).collection.id,
          linkTypeIds: [],
          filters: [],
          linkFilters: [],
          documentIds: [],
        });
        return;
      case QueryItemType.Link:
        query.stems[query.stems.length - 1].linkTypeIds.push((queryItem as LinkQueryItem).linkType.id);
        return;
      case QueryItemType.Attribute:
        query.stems[query.stems.length - 1].filters.push((queryItem as AttributeQueryItem).getAttributeFilter());
        return;
      case QueryItemType.LinkAttribute:
        query.stems[query.stems.length - 1].linkFilters.push(
          (queryItem as LinkAttributeQueryItem).getLinkAttributeFilter()
        );
        return;
      case QueryItemType.Document:
        query.stems[query.stems.length - 1].documentIds.push((queryItem as DocumentQueryItem).document.id);
        return;
      case QueryItemType.Fulltext:
        query.fulltexts.push((queryItem as FulltextQueryItem).text);
        return;
    }
  });

  return query;
}

export class QueryItemsConverter {
  constructor(private data: QueryData) {}

  public fromQuery(query: Query, skipDeleted?: boolean): QueryItem[] {
    return [...this.createStemsItems(query.stems, skipDeleted), ...this.createFulltextsItems(query.fulltexts)];
  }

  private createStemsItems(stems: QueryStem[], skipDeleted: boolean): QueryItem[] {
    return (
      stems?.reduce((items, stem) => {
        items.push(...this.createStemItems(stem, skipDeleted));
        return items;
      }, []) || []
    );
  }

  private createStemItems(stem: QueryStem, skipDeleted: boolean): QueryItem[] {
    const collection = this.findCollection(stem.collectionId);
    if (!collection && skipDeleted) {
      return [];
    }

    return [
      this.createCollectionItem(stem.collectionId),
      ...this.createLinkItems(stem.linkTypeIds, skipDeleted),
      ...this.createAttributeItems(stem, skipDeleted),
      ...this.createDocumentItems(stem.documentIds, skipDeleted),
    ].filter(
      queryItem => isNotNullOrUndefined(queryItem) && !(queryItem.type === QueryItemType.Deleted && skipDeleted)
    );
  }

  private findCollection(collectionId: string): Collection {
    return (this.data.collections || []).find(col => col.id === collectionId);
  }

  public createCollectionItem(collectionId: string): QueryItem {
    const collection = this.findCollection(collectionId);
    if (collection) {
      return new CollectionQueryItem(collection);
    }
    return new DeletedQueryItem(QueryItemType.Collection);
  }

  private createLinkItems(linkTypeIds: string[], skipDeleted: boolean): QueryItem[] {
    const items = [];
    for (const linkTypeId of linkTypeIds || []) {
      const linkType = this.findLinkType(linkTypeId);
      const {collection1, collection2} = this.findCollectionsForLinkType(linkType);
      if (skipDeleted && (!collection1 || !collection2)) {
        return items;
      }

      if (collection1 && collection2) {
        items.push(new LinkQueryItem({...linkType, collections: [collection1, collection2]}));
      } else if (!skipDeleted) {
        items.push(new DeletedQueryItem(QueryItemType.Link));
      }
    }

    return items;
  }

  private findLinkType(linkTypeId: string): LinkType {
    return (this.data.linkTypes || []).find(linkType => linkType.id === linkTypeId);
  }

  private findCollectionsForLinkType(linkType: LinkType): {collection1: Collection; collection2: Collection} {
    const collection1 =
      linkType && (this.data.collections || []).find(collection => collection.id === linkType.collectionIds[0]);
    const collection2 =
      linkType && (this.data.collections || []).find(collection => collection.id === linkType.collectionIds[1]);
    return {collection1, collection2};
  }

  private createAttributeItems(stem: QueryStem, skipDeleted: boolean): QueryItem[] {
    const items = [];
    const filters = stem.filters || [];
    const linkFilters = stem.linkFilters || [];
    const collectionIdsChain = collectionIdsChainForStem(stem, this.data.linkTypes);
    const linkTypeIdsChain = stem.linkTypeIds || [];

    for (let i = 0; i < Math.max(collectionIdsChain.length, linkTypeIdsChain.length); i++) {
      const collectionId = collectionIdsChain[i];
      const linkTypeId = linkTypeIdsChain[i];

      if (collectionId) {
        const collection = this.findCollection(collectionId);
        if (skipDeleted && !collection) {
          return items;
        }

        const collectionFilters = filters.filter(ft => ft.collectionId === collectionId);
        for (const filter of collectionFilters) {
          const attribute = collection && collection.attributes.find(attr => attr.id === filter.attributeId);
          if (attribute) {
            items.push(new AttributeQueryItem(collection, attribute, filter.condition, filter.conditionValues));
          } else if (!skipDeleted) {
            items.push(new DeletedQueryItem(QueryItemType.Attribute));
          }
        }
      }

      if (linkTypeId) {
        const linkType = this.findLinkType(linkTypeId);
        const {collection1, collection2} = this.findCollectionsForLinkType(linkType);
        if (skipDeleted && (!collection1 || !collection2)) {
          return items;
        }
        const linkTypeFilters = linkFilters.filter(ft => ft.linkTypeId === linkTypeId);

        for (const filter of linkTypeFilters) {
          const attribute =
            collection1 && collection2 && linkType.attributes.find(attr => attr.id === filter.attributeId);
          if (attribute) {
            items.push(
              new LinkAttributeQueryItem(
                {...linkType, collections: [collection1, collection2]},
                attribute,
                filter.condition,
                filter.conditionValues
              )
            );
          } else if (!skipDeleted) {
            items.push(new DeletedQueryItem(QueryItemType.LinkAttribute));
          }
        }
      }
    }

    return items;
  }

  private createFulltextsItems(fulltexts: string[]): QueryItem[] {
    return (fulltexts && fulltexts.map(fulltext => new FulltextQueryItem(fulltext))) || [];
  }

  private createDocumentItems(documentIds: string[], skipDeleted: boolean): QueryItem[] {
    return []; // TODO implement once documentIds are used somewhere so it can be tested
  }
}
