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

import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';

type Pair = [CollectionModel, string];

export interface CollectionAttributePair {

  collection: CollectionModel;
  attributeId: string;

}

export function createCollectionAttributePairs(documents: DocumentModel[]): CollectionAttributePair[] {
  return documents
    .map(document => packDocument(document))
    .reduce((result, current) => result.concat(current), [])
    .reduce((result, pair) => reducePairs(result, pair), [])
    .map(pair => pairToCollectionAttributePair(pair));
}

function packDocument(document: DocumentModel): Pair[] {
  const collection = document.collection;
  const attributes = Object.keys(document.data);

  return attributes.map(attribute => [collection, attribute] as Pair);
}

function reducePairs(result: Pair[], pair: Pair) {
  if (!result.find(resultPair => equal(resultPair, pair))) {
    result.push(pair);
  }

  return result;
}

function equal(pairA: Pair, pairB: Pair): boolean {
  return pairA[0] === pairB[0] &&
    pairA[1] === pairB[1];
}

function pairToCollectionAttributePair(pair: Pair): CollectionAttributePair {
  return {
    collection: pair[0],
    attributeId: pair[1]
  };
}
