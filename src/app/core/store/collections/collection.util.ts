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

import {Collection} from './collection';

export function getDefaultAttributeId(collection: Collection): string {
  if (collection.defaultAttributeId) {
    const defaultAttribute = collection.attributes.find(attr => attr.id === collection.defaultAttributeId);
    if (defaultAttribute) {
      return collection.defaultAttributeId;
    }
  }

  const attributes = collection.attributes || [];
  if (attributes.length > 0) {
    return attributes[0].id;
  }

  return '';
}

export function sortCollectionsByFavoriteAndLastUsed(collections: Collection[]): Collection[] {
  return collections.sort((a, b) => {
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      return b.lastTimeUsed.getTime() - a.lastTimeUsed.getTime();
    }
    return a.favorite ? -1 : 1;
  });
}

export function mergeCollections(collectionsA: Collection[], collectionsB: Collection[]): Collection[] {
  const collectionsAIds = collectionsA.map(collection => collection.id);
  const collectionsBToAdd = collectionsB.filter(collection => !collectionsAIds.includes(collection.id));
  return collectionsA.concat(collectionsBToAdd);
}
