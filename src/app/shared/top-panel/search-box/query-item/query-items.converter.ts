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

import {LinkQueryItem} from './model/link.query-item';
import {convertQueryModelToString} from '../../../../core/store/navigation/query.converter';
import {QueryData} from '../query-data';
import {AttributeQueryItem} from './model/attribute.query-item';
import {CollectionQueryItem} from './model/collection.query-item';
import {DocumentQueryItem} from './model/documents.query-item';
import {FulltextQueryItem} from './model/fulltext.query-item';
import {QueryItem} from './model/query-item';
import {QueryItemType} from './model/query-item-type';
import {isNullOrUndefined} from 'util';
import {DeletedQueryItem} from './model/deleted.query-item';
import {AttributeFilter, Query, QueryStem} from '../../../../core/store/navigation/query';

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
          documentIds: [],
        });
        return;
      case QueryItemType.Link:
        query.stems[query.stems.length - 1].linkTypeIds.push((queryItem as LinkQueryItem).linkType.id);
        return;
      case QueryItemType.Attribute:
        query.stems[query.stems.length - 1].filters.push((queryItem as AttributeQueryItem).getAttributeFilter());
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

  public fromQuery(query: Query): QueryItem[] {
    return [...this.createStemsItems(query.stems), ...this.createFulltextsItems(query.fulltexts)];
  }

  private createStemsItems(stems: QueryStem[]): QueryItem[] {
    return (stems && stems.reduce((items, stem) => [...items, ...this.createStemItems(stem)], [])) || [];
  }

  private createStemItems(stem: QueryStem): QueryItem[] {
    return [
      this.createCollectionItem(stem.collectionId),
      ...this.createLinkItems(stem.linkTypeIds),
      ...this.createAttributeItems(stem.filters),
      ...this.createDocumentItems(stem.documentIds),
    ];
  }

  public createCollectionItem(collectionId: string): QueryItem {
    const collection = this.data.collections.find(col => col.id === collectionId);
    if (collection) {
      return new CollectionQueryItem(collection);
    }
    return new DeletedQueryItem(QueryItemType.Collection);
  }

  private createLinkItems(linkTypeIds: string[]): QueryItem[] {
    return (
      (linkTypeIds &&
        linkTypeIds
          .map(linkTypeId => this.data.linkTypes.find(linkType => linkType.id === linkTypeId))
          .filter(linkType => !!linkType)
          .map(linkType => {
            const collection1 = this.data.collections.find(collection => collection.id === linkType.collectionIds[0]);
            const collection2 = this.data.collections.find(collection => collection.id === linkType.collectionIds[1]);
            if (!collection1 || !collection2) {
              return new DeletedQueryItem(QueryItemType.Link);
            }

            linkType.collections = [collection1, collection2];
            return new LinkQueryItem(linkType);
          })
          .filter(queryItem => !isNullOrUndefined(queryItem))) ||
      []
    );
  }

  private createAttributeItems(filters: AttributeFilter[]): QueryItem[] {
    return (
      (filters &&
        filters.map(filter => {
          const collection = this.data.collections.find(col => col.id === filter.collectionId);
          const attribute = collection && collection.attributes.find(attr => attr.id === filter.attributeId);
          if (!attribute) {
            return new DeletedQueryItem(QueryItemType.Attribute);
          }

          return new AttributeQueryItem(collection, attribute, filter.condition, filter.value);
        })) ||
      []
    );
  }

  private createFulltextsItems(fulltexts: string[]): QueryItem[] {
    return (fulltexts && fulltexts.map(fulltext => new FulltextQueryItem(fulltext))) || [];
  }

  private createDocumentItems(documentIds: string[]): QueryItem[] {
    return []; // TODO implement once documentIds are used somewhere so it can be tested
  }
}
