/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {QueryItem} from './query-item';
import {Query} from '../../../core/dto/query';
import {CollectionQueryItem} from './collection-query-item';
import {AttributeQueryItem} from './attribute-query-item';
import {FulltextQueryItem} from './fulltext-query-item';
import {Injectable} from '@angular/core';
import {SearchService} from '../../../core/rest/search.service';
import {Observable} from 'rxjs/Observable';
import {Collection} from '../../../core/dto/collection';
import {QueryConverter} from '../../utils/query-converter';

@Injectable()
export class QueryItemsConverter {

  constructor(private searchService: SearchService) {
  }

  public toQueryString(queryItems: QueryItem[]): string {
    const query: Query = {
      collectionCodes: [],
      filters: []
    };

    queryItems.forEach(queryItem => {
      if (queryItem instanceof CollectionQueryItem) {
        query.collectionCodes.push(queryItem.code);
      } else if (queryItem instanceof AttributeQueryItem) {
        query.filters.push(queryItem.value);
      } else if (queryItem instanceof FulltextQueryItem) {
        query.fulltext = queryItem.text;
      }
    });

    return QueryConverter.toString(query);
  }

  public fromQuery(query: Query): Observable<QueryItem[]> {
    return this.loadNeededCollections(query)
      .map((collections: Collection[]) => QueryItemsConverter.convertToCollectionsMap(collections))
      .map(collectionsMap => QueryItemsConverter.createQueryItems(collectionsMap, query));
  }

  private loadNeededCollections(query: Query): Observable<Collection[]> {
    let collectionCodes = query.filters.map(filter => filter.split(':')[0]);
    collectionCodes = collectionCodes.concat(query.collectionCodes);

    if (collectionCodes) {
      return this.searchService.searchCollections({
        collectionCodes: query.collectionCodes
      });
    }

    return Observable.of([]);
  }

  private static convertToCollectionsMap(collections: Collection[]): any {
    let collectionsMap: any = {};
    collections.forEach(collection => collectionsMap[collection.code] = collection);
    return collectionsMap;
  }

  private static createQueryItems(collectionsMap: any, query: Query): QueryItem[] {
    let queryItems: QueryItem[] = QueryItemsConverter.createCollectionQueryItems(collectionsMap, query);

    queryItems = queryItems.concat(QueryItemsConverter.createAttributeQueryItems(collectionsMap, query));

    if (query.fulltext) {
      queryItems.push(new FulltextQueryItem(query.fulltext));
    }

    return queryItems;
  }

  private static createCollectionQueryItems(collectionsMap: any, query: Query): QueryItem[] {
    return query.collectionCodes.map(collectionCode => {
      let collection = collectionsMap[collectionCode];
      if (collection) {
        return new CollectionQueryItem(collection);
      }
    });
  }

  private static createAttributeQueryItems(collectionsMap: any, query: Query): QueryItem[] {
    return query.filters.map(filter => {
      let filterParts = filter.split(':', 2);
      let collectionCode = filterParts[0];
      let condition = filterParts[1];

      let collection = collectionsMap[collectionCode];
      if (collection) {
        let queryItem = new AttributeQueryItem(collection);
        queryItem.condition = condition;
        return queryItem;
      }
    });
  }

}
