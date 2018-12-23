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

import {LinkTypeDto, SuggestionsDto} from '../../../../../../core/dto';
import {convertCollectionDtoToModel} from '../../../../../../core/store/collections/collection.converter';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkTypeConverter} from '../../../../../../core/store/link-types/link-type.converter';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {ViewConverter} from '../../../../../../core/store/views/view.converter';
import {View} from '../../../../../../core/store/views/view';
import {Suggestions} from './suggestions';

export function convertSuggestionsDtoToModel(suggestions: SuggestionsDto, allCollections: Collection[]): Suggestions {
  if (!suggestions) {
    return null;
  }
  const attributes: Collection[] = suggestions.attributes.map(collection => convertCollectionDtoToModel(collection));
  const collections: Collection[] = suggestions.collections.map(collection => convertCollectionDtoToModel(collection));
  const views: View[] = suggestions.views.map(view => ViewConverter.convertToModel(view));
  const linkTypes: LinkType[] = suggestions.linkTypes.map(link => convertLinkType(link, allCollections));

  return {views, collections, linkTypes, attributes};
}

function convertLinkType(dto: LinkTypeDto, allCollections: Collection[]): LinkType {
  const linkType = LinkTypeConverter.fromDto(dto);
  linkType.collections = [
    allCollections.find(collection => collection.id === linkType.collectionIds[0]),
    allCollections.find(collection => collection.id === linkType.collectionIds[1]),
  ];
  return linkType;
}
