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
import {QueryConverter} from '../../../core/store/navigation/query.converter';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {QueryData} from '../query-data';
import {AttributeQueryItem} from './model/attribute.query-item';
import {CollectionQueryItem} from './model/collection.query-item';
import {DocumentQueryItem} from './model/documents.query-item';
import {FulltextQueryItem} from './model/fulltext.query-item';
import {QueryItem} from './model/query-item';
import {QueryItemType} from './model/query-item-type';
import {isNullOrUndefined} from 'util';

export class QueryItemsConverter {

  constructor(private data: QueryData) {
  }

  public static toQueryString(queryItems: QueryItem[]): string {
    const query: QueryModel = {
      collectionIds: [],
      documentIds: [],
      filters: [],
      linkTypeIds: []
    };

    queryItems.forEach(queryItem => {
      switch (queryItem.type) {
        case QueryItemType.Attribute:
          query.filters.push((queryItem as AttributeQueryItem).getFilter());
          return;
        case QueryItemType.Collection:
          query.collectionIds.push((queryItem as CollectionQueryItem).collection.id);
          return;
        case QueryItemType.Document:
          query.documentIds.push((queryItem as DocumentQueryItem).documentId);
          return;
        case QueryItemType.Fulltext:
          query.fulltext = (queryItem as FulltextQueryItem).text;
          return;
        case QueryItemType.Link:
          query.linkTypeIds.push((queryItem as LinkQueryItem).linkType.id);
          return;
      }
    });

    return QueryConverter.toString(query);
  }

  public fromQuery(query: QueryModel): QueryItem[] {
    return [
      ...this.createCollectionItems(query),
      ...this.createAttributeItems(query.filters),
      ...this.createDocumentItems(query.documentIds),
      ...this.createFulltextItems(query.fulltext),
      ...this.createLinkItems(query.linkTypeIds)
    ];
  }

  private createAttributeItems(filters: string[]): QueryItem[] {
    return filters.map(filter => {
      const [collectionId, attributeId, fullCondition] = filter.split(':', 3);
      const collection = this.data.collections.find(collection => collection.id === collectionId);
      const attribute = collection && collection.attributes.find(attribute => attribute.id === attributeId);
      if (!attribute) {
        return null;
      }

      const [condition, conditionValue] = fullCondition.split(' ', 2);

      return new AttributeQueryItem(collection, attribute, condition, conditionValue);
    }).filter(queryItem => !isNullOrUndefined(queryItem));
  }

  private createCollectionItems(query: QueryModel): QueryItem[] {
    return this.data.collections.filter(collection => {
      return (query.collectionIds && query.collectionIds.includes(collection.id));
    }).map(collection => new CollectionQueryItem(collection));
  }

  private createDocumentItems(documentIds: string[]): QueryItem[] {
    return []; // TODO implement once documentIds are used somewhere so it can be tested
  }

  private createFulltextItems(fulltext: string): QueryItem[] {
    return fulltext ? [new FulltextQueryItem(fulltext)] : [];
  }

  private createLinkItems(linkTypeIds: string[]): QueryItem[] {
    return this.data.linkTypes.filter(linkType => linkTypeIds.includes(linkType.id))
      .map(linkType => {
        const collection1 = this.data.collections.find(collection => collection.id === linkType.collectionIds[0]);
        const collection2 = this.data.collections.find(collection => collection.id === linkType.collectionIds[1]);
        if (!collection1 || !collection2) {
          return null;
        }

        linkType.collections = [collection1, collection2];
        return new LinkQueryItem(linkType);
      }).filter(queryItem => !isNullOrUndefined(queryItem));
  }

}
