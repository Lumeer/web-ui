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

import {DocumentModel} from './document.model';
import {ConditionType} from '../navigation/query.model';
import {QueryConverter} from '../navigation/query.converter';
import {CollectionModel} from '../collections/collection.model';

export function sortDocumentsByCreationDate(documents: DocumentModel[]): DocumentModel[] {
  const sortedDocuments = [...documents];
  return sortedDocuments.sort((a, b) => {
    console.log('sorting', a.creationDate.getTime(), b.creationDate.getTime());
    return a.creationDate.getTime() - b.creationDate.getTime()
  });
}

export function generateDocumentData(collection: CollectionModel, filters: string[]): { [attributeId: string]: any } {
  if (!collection) {
    return [];
  }
  const data = collection.attributes.reduce((acc, attr) => {
    acc[attr.id] = '';
    return acc;
  }, {});

  if (filters) {
    filters.map(filter => {
      const attrFilter = QueryConverter.parseFilter(filter);

      if (attrFilter.collectionId === collection.id) {
        switch (attrFilter.conditionType) {
          case ConditionType.GreaterThan:
            data[attrFilter.attributeId] = attrFilter.value + 1;
            break;
          case ConditionType.LowerThan:
            data[attrFilter.attributeId] = attrFilter.value - 1;
            break;
          case ConditionType.NotEquals:
            if (attrFilter.value) {
              if (typeof attrFilter.value === 'number') {
                data[attrFilter.attributeId] = attrFilter.value + 1;
              } else {
                data[attrFilter.attributeId] = '';
              }
            } else {
              data[attrFilter.attributeId] = 'N/A';
            }
            break;
          case ConditionType.GreaterThanEquals:
          case ConditionType.LowerThanEquals:
          case ConditionType.Equals:
          default:
            data[attrFilter.attributeId] = attrFilter.value;
        }
      }
    });
  }

  return data;
}
