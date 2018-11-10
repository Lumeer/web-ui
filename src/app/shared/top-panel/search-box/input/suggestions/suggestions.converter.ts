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

import {Observable, of} from 'rxjs';
import {LinkType, Suggestions} from '../../../../../core/dto';
import {CollectionConverter} from '../../../../../core/store/collections/collection.converter';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {LinkTypeConverter} from '../../../../../core/store/link-types/link-type.converter';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {ViewConverter} from '../../../../../core/store/views/view.converter';
import {ViewModel} from '../../../../../core/store/views/view.model';
import {AttributeQueryItem} from '../../query-item/model/attribute.query-item';
import {CollectionQueryItem} from '../../query-item/model/collection.query-item';
import {LinkQueryItem} from '../../query-item/model/link.query-item';
import {QueryItem} from '../../query-item/model/query-item';
import {ViewQueryItem} from '../../query-item/model/view.query-item';

export class SuggestionsConverter {
  public static convertSuggestionsToQueryItems(
    suggestions: Suggestions,
    allCollections: CollectionModel[]
  ): Observable<QueryItem[]> {
    if (!suggestions) {
      return of([]);
    }

    const attributes: CollectionModel[] = suggestions.attributes.map(collection =>
      CollectionConverter.fromDto(collection)
    );
    const collections: CollectionModel[] = suggestions.collections.map(collection =>
      CollectionConverter.fromDto(collection)
    );
    const views: ViewModel[] = suggestions.views.map(view => ViewConverter.convertToModel(view));
    const linkTypes: LinkTypeModel[] = suggestions.linkTypes.map(link =>
      SuggestionsConverter.convertLinkType(link, allCollections)
    );

    const suggestedQueryItems: QueryItem[] = [
      ...SuggestionsConverter.createCollectionQueryItems(collections),
      ...SuggestionsConverter.createAttributeQueryItems(attributes),
      ...SuggestionsConverter.createViewQueryItems(views),
      ...SuggestionsConverter.createLinkQueryItems(linkTypes),
    ];
    return of(suggestedQueryItems);
  }

  private static convertLinkType(dto: LinkType, allCollections: CollectionModel[]): LinkTypeModel {
    const linkType = LinkTypeConverter.fromDto(dto);
    linkType.collections = [
      allCollections.find(collection => collection.id === linkType.collectionIds[0]),
      allCollections.find(collection => collection.id === linkType.collectionIds[1]),
    ];
    return linkType;
  }

  private static createCollectionQueryItems(collections: CollectionModel[]): QueryItem[] {
    return collections.map(collection => new CollectionQueryItem(collection));
  }

  private static createAttributeQueryItems(collections: CollectionModel[]): QueryItem[] {
    return collections.map(collection => new AttributeQueryItem(collection, collection.attributes[0], '', ''));
  }

  private static createViewQueryItems(views: ViewModel[]): QueryItem[] {
    return views.map(view => new ViewQueryItem(view));
  }

  private static createLinkQueryItems(linkTypes: LinkTypeModel[]): QueryItem[] {
    return linkTypes.map(linkType => new LinkQueryItem(linkType));
  }
}
